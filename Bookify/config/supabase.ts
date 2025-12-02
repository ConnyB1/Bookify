import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ✅ Configuración desde variables de entorno
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ustbbyoeubzyjkhfmsqu.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdGJieW9ldWJ6eWpraGZtc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQ4NTYsImV4cCI6MjA3NzA5MDg1Nn0.k8KoyDJSliELSxYRHV10Rswh5HVNSbtfkng32j3GTGg';

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
  console.error('Error initializing Supabase client:', error);
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
