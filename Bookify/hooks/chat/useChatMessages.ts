import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { buildApiUrl } from '../../config/api';
import type { Message } from '../../types/chat';

interface UseChatMessagesReturn {
  messages: Message[];
  loading: boolean;
  refreshing: boolean;
  sending: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loadMessages: () => Promise<void>;
  loadNewMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function useChatMessages(
  chatId: number,
  userId: number | undefined
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!chatId || !userId) return;

    try {
      const response = await fetch(
        buildApiUrl(`/chat/${chatId}/messages?userId=${userId}`)
      );

      if (!response.ok) {
        throw new Error('Error al cargar mensajes');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  }, [chatId, userId]);

  const loadNewMessages = useCallback(async () => {
    if (!chatId || !userId || messages.length === 0) return;

    try {
      const lastTimestamp = messages[messages.length - 1].timestamp;
      const response = await fetch(
        buildApiUrl(
          `/chat/${chatId}/new-messages?userId=${userId}&since=${encodeURIComponent(lastTimestamp)}`
        )
      );

      if (!response.ok) return;

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        console.log(`📬 Polling: ${result.data.length} mensaje(s) nuevo(s)`);
        setMessages((prev) => [...prev, ...result.data]);
      }
    } catch (error) {
      console.error('Error loading new messages:', error);
    }
  }, [chatId, userId, messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !userId || sending) return;

      const textToSend = text.trim();
      setSending(true);

      try {
        const response = await fetch(buildApiUrl('/chat/send'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_chat: chatId,
            contenido_texto: textToSend,
            userId: userId,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setMessages((prev) => [...prev, result.data]);
        } else {
          Alert.alert('Error', 'No se pudo enviar el mensaje');
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'No se pudo enviar el mensaje');
        throw error;
      } finally {
        setSending(false);
      }
    },
    [chatId, userId, sending]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [loadMessages]);

  return {
    messages,
    loading,
    refreshing,
    sending,
    setMessages,
    loadMessages,
    loadNewMessages,
    sendMessage,
    onRefresh,
  };
}
