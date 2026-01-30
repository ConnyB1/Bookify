import { useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PresenceState } from '../../types/chat';

interface UseChatPresenceReturn extends PresenceState {
  setupPresence: (
    channel: RealtimeChannel,
    otherUserId: number,
    currentUser: { id_usuario: number; nombre_usuario: string }
  ) => void;
}

export function useChatPresence(): UseChatPresenceReturn {
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  const setupPresence = useCallback(
    (
      channel: RealtimeChannel,
      otherUserId: number,
      currentUser: { id_usuario: number; nombre_usuario: string }
    ) => {
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.keys(state).map((key) => parseInt(key, 10));
        setOnlineUsers(userIds);

        if (otherUserId && userIds.includes(otherUserId)) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Usuario conectado:', key, newPresences);
        const joinedUserId = parseInt(key, 10);
        if (joinedUserId === otherUserId) {
          setIsOnline(true);
        }
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Usuario desconectado:', key, leftPresences);
        const leftUserId = parseInt(key, 10);
        if (leftUserId === otherUserId) {
          setIsOnline(false);
        }
      });
    },
    []
  );

  return {
    isOnline,
    onlineUsers,
    setupPresence,
  };
}
