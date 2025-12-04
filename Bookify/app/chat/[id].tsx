import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseEnabled } from '../../config/supabase';
import { buildApiUrl } from '../../config/api';

import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatPresence } from '../../hooks/chat/useChatPresence';
import { useChatRealtime } from '../../hooks/chat/useChatRealtime';
import { useChatExchange } from '../../hooks/chat/useChatExchange';

import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatMessageList } from '../../components/chat/ChatMessageList';
import { ChatInput } from '../../components/chat/ChatInput';
import { ExchangeSelector } from '../../components/chat/ExchangeSelector';
import { ExchangeDetailsModal } from '../../components/chat/ExchangeDetailsModal';
import { RatingModal } from '../../components/chat/RatingModal';
import CustomAlert from '../../components/CustomAlert';
import { useAlertDialog } from '../../hooks/useAlertDialog';

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
  const [showExchangeModal, setShowExchangeModal] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [hasRated, setHasRated] = React.useState(false);
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  const otherUser: ChatUser = {
    id: otherUserIdNum,
    name: userName || 'Chat',
    photo: otherUserPhoto,
  };

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

  const { isOnline, setupPresence } = useChatPresence();

  const {
    exchanges,
    selectedExchange,
    exchange,
    loading: exchangeLoading,
    canSelectBook,
    selectExchange,
    selectOfferedBook,
    reloadExchange,
  } = useChatExchange(chatId, user?.id_usuario);

  const scrollToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

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

  useEffect(() => {
    if (!chatId || !user) {
      router.back();
      return;
    }
    loadMessages();
    if (!isSupabaseEnabled) {
      startPolling(loadNewMessages);
    }

    return () => {
      stopPolling();
    };
  }, [chatId, user]);

  useEffect(() => {
    const checkRating = async () => {
      if (!selectedExchange || !user?.id_usuario) return;

      try {
        const response = await fetch(
          buildApiUrl(`/api/rating/check?exchangeId=${selectedExchange.id_intercambio}&userId=${user.id_usuario}`)
        );
        const result = await response.json();
        
        if (result.success) {
          setHasRated(result.data.hasRated);
        }
      } catch (error) {
        console.error('Error verificando calificación:', error);
      }
    };

    checkRating();
  }, [selectedExchange, user]);

  // Manejar envío de mensajes
  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    setTimeout(scrollToEnd, 100);
  };

  // Manejar selección de libro para ofrecer
  const handleSelectBook = () => {
    if (!selectedExchange) return;
    
    const otherUserId = selectedExchange.id_usuario_solicitante;
    
    setShowExchangeModal(false);
    
    setTimeout(() => {
      router.push({
        pathname: '/libro_seleccionado',
        params: {
          chatId: chatId.toString(),
          exchangeId: selectedExchange.id_intercambio.toString(),
          otherUserId: otherUserId.toString(),
        },
      } as any);
    }, 300);
  };

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
          onToggleExchangeCard={() => {
            if (exchanges.length === 0) {
              showAlert('Sin intercambios', 'No hay intercambios activos en este chat todavía', [{ text: 'OK', onPress: hideAlert }]);
            } else {
              setShowExchangeCard(!showExchangeCard);
            }
          }}
          onTogglecalificar={() => {
            if (exchanges.length === 0) {
              showAlert('Sin intercambios', 'No hay intercambios para calificar en este chat', [{ text: 'OK', onPress: hideAlert }]);
            } else if (!hasRated && selectedExchange?.confirmacion_solicitante && selectedExchange?.confirmacion_receptor) {
              setShowRatingModal(true);
            } else if (hasRated) {
              showAlert('Ya calificaste', 'Ya has calificado este intercambio', [{ text: 'OK', onPress: hideAlert }]);
            } else {
              showAlert('No disponible', 'Solo puedes calificar cuando ambos usuarios han confirmado el intercambio', [{ text: 'OK', onPress: hideAlert }]);
            }
          }}
          hasExchange={exchanges.length > 0}
          hasRated={hasRated}
        />

        <View style={styles.messagesContainer}>
          {/* Selector de intercambios */}
          {showExchangeCard && (
            <View style={styles.exchangeCardOverlay}>
              <ExchangeSelector
                exchanges={exchanges}
                selectedExchangeId={selectedExchange?.id_intercambio}
                onSelectExchange={selectExchange}
                currentUserId={user?.id_usuario}
                onOpenDetails={(exchange) => {
                  setShowExchangeModal(true);
                }}
              />
            </View>
          )}

          <ChatMessageList
            messages={messages}
            currentUserId={user?.id_usuario}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onContentSizeChange={() => scrollToEnd()}
            listRef={flatListRef}
          />
        </View>

        <ChatInput onSend={handleSendMessage} sending={sending} />
      </KeyboardAvoidingView>
      
      {selectedExchange && (
        <ExchangeDetailsModal
          visible={showExchangeModal}
          exchange={selectedExchange}
          canSelectBook={canSelectBook}
          onSelectBook={handleSelectBook}
          currentUserId={user?.id_usuario}
          onExchangeUpdate={reloadExchange}
          onClose={() => setShowExchangeModal(false)}
        />
      )}
      
      {selectedExchange && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          otherUserName={otherUser.name}
          otherUserId={otherUserIdNum}
          otherUserPhoto={otherUser.photo}
          currentUserId={user?.id_usuario || 0}
          exchangeId={selectedExchange.id_intercambio}
          onRatingSubmitted={() => {
            setHasRated(true);
            showAlert('Éxito', 'Tu calificación ha sido enviada exitosamente', [{ text: 'Genial', onPress: hideAlert }]);
          }}
        />
      )}
      
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  exchangeCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
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
