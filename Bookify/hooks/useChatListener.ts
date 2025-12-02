import { useEffect, useRef } from 'react';
import { supabase, isSupabaseEnabled } from '@/config/supabase';

interface ChatListenerProps {
  userId: number;
  onNewChat: () => void;
}


export function useChatListener({ userId, onNewChat }: ChatListenerProps) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || !userId) {
      return;
    }

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
          onNewChat();
        }
      )
      .subscribe((status) => {
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, onNewChat]);

  return { isListening: isSupabaseEnabled && !!userId && !!supabase };
}
