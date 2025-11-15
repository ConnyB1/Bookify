import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Message } from '../../types/chat';

interface ChatMessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
}

export function ChatMessageBubble({ message, isMyMessage }: ChatMessageBubbleProps) {
  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMyMessage ? styles.myBubble : styles.otherBubble,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>{message.emisor.nombre_usuario}</Text>
        )}
        <Text style={styles.messageText}>{message.contenido_texto}</Text>
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#d500ff',
  },
  otherBubble: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  senderName: {
    fontSize: 12,
    color: '#bbb',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
  },
});
