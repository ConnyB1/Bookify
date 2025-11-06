import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { supabase, isSupabaseEnabled } from '../../config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id_mensaje: number;
  id_chat: number;
  id_usuario_emisor: number;
  contenido_texto: string;
  timestamp: string;
  emisor: {
    id_usuario: number;
    nombre_usuario: string;
    foto_perfil_url?: string;
  };
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, userName } = useLocalSearchParams<{ id: string; userName: string }>();
  const chatId = id ? parseInt(id) : 0;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!chatId || !user) {
      Alert.alert('Error', 'Chat inválido');
      router.back();
      return;
    }

    loadMessages();
    
    // Si Supabase está habilitado, usar Realtime; sino, usar polling
    if (isSupabaseEnabled && supabase) {
      setupRealtimeSubscription();
    } else {
      startPolling();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [chatId, user]);

  const setupRealtimeSubscription = () => {
    if (!supabase || !chatId) return;

    console.log('🔄 Setting up Supabase Realtime for chat:', chatId);

    const channel = supabase
      .channel(`chat-${chatId}`, {
        config: {
          broadcast: { self: false }, // No recibir mis propios mensajes
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensaje',
          filter: `id_chat=eq.${chatId}`,
        },
        async (payload) => {
          console.log('✅ New message received via Realtime:', payload);
          console.log('📦 Payload new record:', payload.new);
          
          // Verificar si el mensaje es de otro usuario
          const newMessageData = payload.new as any;
          if (newMessageData.id_usuario_emisor === user?.id_usuario) {
            console.log('⏭️ Ignorando mi propio mensaje');
            return;
          }
          
          // Cargar solo el nuevo mensaje específico
          try {
            const response = await fetch(
              buildApiUrl(`/chat/${chatId}/messages?userId=${user?.id_usuario}`)
            );
            const result = await response.json();
            if (result.success && result.data) {
              console.log('🔄 Actualizando lista de mensajes (nuevo mensaje detectado)');
              setMessages(result.data);
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          } catch (error) {
            console.error('Error loading new message:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to Realtime updates for chat', chatId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error, falling back to polling');
          startPolling();
        } else {
          console.log(`📡 Realtime status: ${status}`);
        }
      });

    channelRef.current = channel;
  };

  const cleanupSubscriptions = () => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      console.log('🧹 Cleaned up Realtime subscription');
    }
    stopPolling();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const loadMessages = async () => {
    if (!chatId || !user) return;

    try {
      const response = await fetch(
        buildApiUrl(`/chat/${chatId}/messages?userId=${user.id_usuario}`)
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
  };

  const startPolling = () => {
    console.log('🔄 Iniciando polling cada 2 segundos...');
    // Polling cada 2 segundos para nuevos mensajes
    pollingIntervalRef.current = setInterval(() => {
      if (chatId && user) {
        loadNewMessages();
      }
    }, 2000) as unknown as NodeJS.Timeout;
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Deteniendo polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const loadNewMessages = async () => {
    if (!chatId || !user || messages.length === 0) return;

    try {
      const lastTimestamp = messages[messages.length - 1].timestamp;
      const response = await fetch(
        buildApiUrl(
          `/chat/${chatId}/new-messages?userId=${user.id_usuario}&since=${encodeURIComponent(lastTimestamp)}`
        )
      );

      if (!response.ok) return;

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        console.log(`📬 Polling: ${result.data.length} mensaje(s) nuevo(s)`);
        setMessages((prev) => [...prev, ...result.data]);
        // Auto-scroll al final
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading new messages:', error);
    }
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!text.trim() || !user || sending) return;

    const textToSend = text.trim();
    setText('');
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
          userId: user.id_usuario,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data]);
        // Auto-scroll al final
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', 'No se pudo enviar el mensaje');
        setText(textToSend); // Restaurar el texto si falló
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      setText(textToSend); // Restaurar el texto si falló
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.id_usuario_emisor === user?.id_usuario;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.emisor.nombre_usuario}</Text>
          )}
          <Text style={styles.messageText}>{item.contenido_texto}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b00ff" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
          {isSupabaseEnabled && (
            <Text style={styles.realtimeIndicator}>🚀 Tiempo Real Activado</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{userName || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {isSupabaseEnabled ? '🟢 En línea (Realtime)' : '🔵 En línea'}
            </Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id_mensaje.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8b00ff']}
              tintColor="#8b00ff"
            />
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 12,
    fontSize: 16,
  },
  realtimeIndicator: {
    color: '#8b00ff',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#000',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: '#8b00ff',
  },
  otherMessageBubble: {
    backgroundColor: '#2a2a2a',
  },
  senderName: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b00ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
