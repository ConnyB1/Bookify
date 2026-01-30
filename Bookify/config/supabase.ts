import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, 
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} catch (error) {
  console.error(error);
}

export const supabase = supabaseClient;
export const isSupabaseEnabled = !!supabaseClient;

export type Mensaje = {
  id_mensaje: number;
  id_chat: number;
  id_usuario_emisor: number;
  contenido_texto: string;
  timestamp: string;
};

export type Chat = {
  id_chat: number;
  id_intercambio: number | null; 
};

export type ChatUsuario = {
  id_chat: number;
  id_usuario: number;
};
