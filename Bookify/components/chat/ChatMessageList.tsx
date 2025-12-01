import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { ChatMessageBubble } from './ChatMessageBubble';
import type { Message } from '../../types/chat';

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: number | undefined;
  refreshing: boolean;
  onRefresh: () => void;
  onContentSizeChange: () => void;
  listRef: React.RefObject<FlatList | null>;
}

export function ChatMessageList({
  messages,
  currentUserId,
  refreshing,
  onRefresh,
  onContentSizeChange,
  listRef,
}: ChatMessageListProps) {
  // Filtrar solo mis mensajes para calcular posiciones
  const myMessages = messages.filter(msg => msg.id_usuario_emisor === currentUserId);
  const totalMyMessages = myMessages.length;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.id_usuario_emisor === currentUserId;
    
    // Calcular índice del mensaje propio en la secuencia
    let myMessageIndex = 0;
    if (isMyMessage) {
      myMessageIndex = myMessages.findIndex(msg => msg.id_mensaje === item.id_mensaje);
    }
    
    return (
      <ChatMessageBubble 
        message={item} 
        isMyMessage={isMyMessage}
        messageIndex={myMessageIndex}
        totalMessages={totalMyMessages}
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id_mensaje.toString()}
      contentContainerStyle={styles.listContent}
      onContentSizeChange={onContentSizeChange}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#d500ff']}
          tintColor="#d500ff"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#151718',
  },
});
