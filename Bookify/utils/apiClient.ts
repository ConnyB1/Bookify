import { buildApiUrl } from '../config/api';
import { getTokens, UserTokens } from './auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: number;
}

const DEFAULT_TIMEOUT = 15_000; // 15s
const DEFAULT_RETRY = 1;

async function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const tokens: UserTokens | null = await getTokens();
    if (tokens && tokens.accessToken) {
      return { Authorization: `Bearer ${tokens.accessToken}` };
    }
  } catch (err) {
    // ignore and return empty
  }
  return {};
}

async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  options: RequestOptions = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: any }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  const retry = options.retry ?? DEFAULT_RETRY;

  const url = endpoint.startsWith('http') ? endpoint : buildApiUrl(endpoint);

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const authHeader = await getAuthHeader();
  const headers = { ...baseHeaders, ...authHeader };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined && body !== null) {
    // allow sending FormData from callers by checking instance
    if (typeof FormData !== 'undefined' && body instanceof FormData) {

      delete (fetchOptions.headers as any)['Content-Type'];
      fetchOptions.body = body as any;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  let attempt = 0;
  while (attempt <= retry) {
    attempt += 1;
    try {
      const raw = await timeoutPromise(timeoutMs, fetch(url, fetchOptions));
      const status = raw.status;
      const text = await raw.text();
      let data: any = undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch (e) {
        data = text;
      }

      if (raw.ok) {
        return { ok: true, status, data };
      }

      // Non-2xx
      return { ok: false, status, error: data || { message: 'Request failed' } };
    } catch (err: any) {
      // retry on network/timeout
      if (attempt > retry) {
        return { ok: false, status: 0, error: err };
      }
      // small backoff
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }

  return { ok: false, status: 0, error: new Error('unreachable') };
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) => request<T>('GET', endpoint, undefined, options),
  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>('POST', endpoint, body, options),
  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>('PUT', endpoint, body, options),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) => request<T>('PATCH', endpoint, body, options),
  del: <T = any>(endpoint: string, options?: RequestOptions) => request<T>('DELETE', endpoint, undefined, options),
};
