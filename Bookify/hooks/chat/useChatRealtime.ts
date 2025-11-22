import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from '../../config/supabase';
import { buildApiUrl } from '../../config/api';
import type { Message } from '../../types/chat';

interface UseChatRealtimeParams {
  chatId: number;
  userId: number | undefined;
  otherUserId: number;
  currentUser: { id_usuario: number; nombre_usuario: string } | null;
  onMessagesUpdate: (messages: Message[]) => void;
  onPresenceSetup?: (channel: RealtimeChannel) => void;
  onScrollToEnd: () => void;
}

interface UseChatRealtimeReturn {
  channelRef: React.MutableRefObject<RealtimeChannel | null>;
  pollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  startPolling: (loadNewMessages: () => Promise<void>) => void;
  stopPolling: () => void;
  cleanupSubscriptions: () => void;
}

export function useChatRealtime({
  chatId,
  userId,
  otherUserId,
  currentUser,
  onMessagesUpdate,
  onPresenceSetup,
  onScrollToEnd,
}: UseChatRealtimeParams): UseChatRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = (loadNewMessages: () => Promise<void>) => {
    console.log('Iniciando polling cada 2 segundos...');
    pollingIntervalRef.current = setInterval(() => {
      if (chatId && userId) {
        loadNewMessages();
      }
    }, 2000) as unknown as NodeJS.Timeout;
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const cleanupSubscriptions = () => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      console.log('🧹 Cleaned up Realtime subscription');
    }
    stopPolling();
  };

  const setupRealtimeSubscription = () => {
    if (!supabase || !chatId || !currentUser) return;

    const channel = supabase
      .channel(`chat-${chatId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUser.id_usuario.toString() },
        },
      });

    // Configurar listeners de presencia si se proporciona el callback
    if (onPresenceSetup) {
      onPresenceSetup(channel);
    }

    // Configurar listener de nuevos mensajes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensaje',
          filter: `id_chat=eq.${chatId}`,
        },
        async (payload) => {
          const newMessageData = payload.new as any;
          if (newMessageData.id_usuario_emisor === currentUser.id_usuario) {
            console.log('⏭️ Ignorando mi propio mensaje');
            return;
          }

          // Cargar mensajes actualizados
          try {
            const response = await fetch(
              buildApiUrl(`/chat/${chatId}/messages?userId=${userId}`)
            );
            const result = await response.json();
            if (result.success && result.data) {
              console.log('🔄 Actualizando lista de mensajes (nuevo mensaje detectado)');
              onMessagesUpdate(result.data);
              setTimeout(() => {
                onScrollToEnd();
              }, 100);
            }
          } catch (error) {
            console.error('Error loading new message:', error);
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id_usuario,
            username: currentUser.nombre_usuario,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CHANNEL_ERROR') {
          // Fallback a polling se manejará en el component
        } else {
          console.log(`ealtime status: ${status}`);
        }
      });

    channelRef.current = channel;
  };

  useEffect(() => {
    if (isSupabaseEnabled && supabase && chatId && currentUser) {
      setupRealtimeSubscription();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [chatId, currentUser?.id_usuario]);

  return {
    channelRef,
    pollingIntervalRef,
    startPolling,
    stopPolling,
    cleanupSubscriptions,
  };
}
