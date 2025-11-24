import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseEnabled } from '../../config/supabase';

// Hooks personalizados
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatPresence } from '../../hooks/chat/useChatPresence';
import { useChatRealtime } from '../../hooks/chat/useChatRealtime';
import { useChatExchange } from '../../hooks/chat/useChatExchange';

// Componentes
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatMessageList } from '../../components/chat/ChatMessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { ExchangeBookCard } from '../../components/chat/ExchangeBookCard';

// Tipos
import type { ChatUser } from '../../types/chat';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, userName, otherUserId, otherUserPhoto } = useLocalSearchParams<{
    id: string;
    userName: string;
    otherUserId: string;
    otherUserPhoto: string;
  }>();

  const chatId = id ? parseInt(id, 10) : 0;
  const otherUserIdNum = otherUserId ? parseInt(otherUserId, 10) : 0;
  const flatListRef = useRef<FlatList>(null);
  const [showExchangeCard, setShowExchangeCard] = React.useState(false); // Cerrado por defecto

  // Información del otro usuario
  const otherUser: ChatUser = {
    id: otherUserIdNum,
    name: userName || 'Chat',
    photo: otherUserPhoto,
  };

  // Hook de mensajes
  const {
    messages,
    loading,
    refreshing,
    sending,
    setMessages,
    loadMessages,
    loadNewMessages,
    sendMessage,
    onRefresh,
  } = useChatMessages(chatId, user?.id_usuario);

  // Hook de presencia
  const { isOnline, setupPresence } = useChatPresence();

  // Hook de intercambio
  const {
    exchange,
    loading: exchangeLoading,
    canSelectBook,
    selectOfferedBook,
    reloadExchange,
  } = useChatExchange(chatId, user?.id_usuario);

  // Función para hacer scroll al final
  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Hook de realtime
  const { startPolling, stopPolling } = useChatRealtime({
    chatId,
    userId: user?.id_usuario,
    otherUserId: otherUserIdNum,
    currentUser: user,
    onMessagesUpdate: (newMessages) => {
      setMessages(newMessages);
      setTimeout(scrollToEnd, 100);
    },
    onPresenceSetup: (channel) => {
      if (user) {
        setupPresence(channel, otherUserIdNum, user);
      }
    },
    onScrollToEnd: scrollToEnd,
  });

  // Efecto inicial
  useEffect(() => {
    if (!chatId || !user) {
      Alert.alert('Error', 'Chat inválido');
      router.back();
      return;
    }

    loadMessages();

    // Si Supabase no está habilitado, usar polling
    if (!isSupabaseEnabled) {
      startPolling(loadNewMessages);
    }

    return () => {
      stopPolling();
    };
  }, [chatId, user]);

  // Manejar envío de mensajes
  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    setTimeout(scrollToEnd, 100);
  };

  // Manejar selección de libro para ofrecer
  const handleSelectBook = () => {
    if (!exchange) return;
    
    // El receptor selecciona un libro del solicitante
    // otherUserId es el ID del solicitante
    const otherUserId = exchange.id_usuario_solicitante;
    
    console.log('[Chat] Navegando a seleccionar libro del usuario:', otherUserId);
    
    // Navegar a una pantalla para seleccionar un libro del solicitante
    router.push({
      pathname: '/select-book-for-exchange',
      params: {
        chatId: chatId.toString(),
        exchangeId: exchange.id_intercambio.toString(),
        otherUserId: otherUserId.toString(),
      },
    } as any);
  };

  // Pantalla de carga
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d500ff" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
      >
        <ChatHeader
          otherUser={otherUser}
          isOnline={isOnline}
          onBack={() => router.back()}
          onUserPress={() => {
            if (otherUserIdNum) {
              router.push(`/perfil/${otherUserIdNum}` as any);
            }
          }}
          showExchangeCard={showExchangeCard}
          onToggleExchangeCard={() => setShowExchangeCard(!showExchangeCard)}
          hasExchange={!!exchange}
        />

        {/* Mostrar información del intercambio si existe */}
        {exchange && !exchangeLoading && showExchangeCard && (
          <ExchangeBookCard
            key={`exchange-${exchange.id_intercambio}`}
            exchange={exchange}
            canSelectBook={canSelectBook}
            onSelectBook={handleSelectBook}
            currentUserId={user?.id_usuario}
            onExchangeUpdate={reloadExchange}
          />
        )}

        <ChatMessageList
          messages={messages}
          currentUserId={user?.id_usuario}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onContentSizeChange={() => scrollToEnd()}
          listRef={flatListRef}
        />

        <ChatInput onSend={handleSendMessage} sending={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 16,
  },
});
