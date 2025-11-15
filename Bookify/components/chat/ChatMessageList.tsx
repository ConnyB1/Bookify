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
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.id_usuario_emisor === currentUserId;
    return <ChatMessageBubble message={item} isMyMessage={isMyMessage} />;
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id_mensaje.toString()}
      contentContainerStyle={styles.listContent}
      onContentSizeChange={onContentSizeChange}
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
    backgroundColor: '#151718',
  },
});
