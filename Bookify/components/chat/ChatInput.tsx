import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  sending: boolean;
}

export function ChatInput({ onSend, sending }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    
    const textToSend = text.trim();
    setText(''); // Limpiar inmediatamente para mejor UX
    
    try {
      await onSend(textToSend);
    } catch (error) {
      // Si falla, restaurar el texto
      setText(textToSend);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Escribe un mensaje..."
        placeholderTextColor="#888"
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!text.trim() || sending) && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!text.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#151718',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d500ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
