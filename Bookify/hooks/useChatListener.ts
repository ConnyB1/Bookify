import { useEffect, useRef } from 'react';
import { supabase, isSupabaseEnabled } from '@/config/supabase';

interface ChatListenerProps {
  userId: number;
  onNewChat: () => void;
}

/**
 * Hook que escucha nuevos chats creados para el usuario actual
 * usando Supabase Realtime
 */
export function useChatListener({ userId, onNewChat }: ChatListenerProps) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || !userId) {
      console.log('⚠️ [Chat Listener] Supabase no disponible o sin userId');
      return;
    }

    console.log(`🔔 [Chat Listener] Iniciando listener para usuario ${userId}`);

    // Suscribirse a inserciones en la tabla chat_usuario
    const channel = supabase
      .channel(`user-chats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_usuario',
          filter: `id_usuario=eq.${userId}`,
        },
        (payload) => {
          console.log('🆕 [Chat Listener] Nuevo chat detectado:', payload);
          onNewChat();
        }
      )
      .subscribe((status) => {
        console.log(`🔔 [Chat Listener] Estado de suscripción: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔕 [Chat Listener] Desconectando listener');
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, onNewChat]);

  return { isListening: isSupabaseEnabled && !!userId && !!supabase };
}
