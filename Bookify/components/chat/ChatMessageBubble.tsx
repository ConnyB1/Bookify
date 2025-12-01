import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Message } from '../../types/chat';

interface ChatMessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  messageIndex?: number;
  totalMessages?: number;
}

export function ChatMessageBubble({ message, isMyMessage, messageIndex = 0, totalMessages = 1 }: ChatMessageBubbleProps) {
  // Calcular color basado en posición: mensajes más antiguos (índice bajo) más oscuros, nuevos (índice alto) más claros
  const getMessageColor = () => {
    if (!isMyMessage || totalMessages === 0) return '#6100BD';
    
    // Normalizar posición entre 0 y 1 (0 = más antiguo, 1 = más nuevo)
    const position = totalMessages > 1 ? messageIndex / (totalMessages - 1) : 1;
    
    // Interpolar entre morado oscuro (#6100BD) y morado claro (#D500FF)
    const startColor = { r: 97, g: 0, b: 189 };  // #6100BD
    const endColor = { r: 213, g: 0, b: 255 };   // #D500FF
    
    const r = Math.round(startColor.r + (endColor.r - startColor.r) * position);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * position);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * position);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const backgroundColor = getMessageColor();

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {isMyMessage ? (
        <View
          style={[styles.bubble, styles.myBubble, { backgroundColor }]}
        >
          <Text style={styles.messageText}>{message.contenido_texto}</Text>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      ) : (
        <View style={[styles.bubble, styles.otherBubble]}>
          <Text style={styles.senderName}>{message.emisor.nombre_usuario}</Text>
          <Text style={styles.messageText}>{message.contenido_texto}</Text>
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
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
    overflow: 'hidden',
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
