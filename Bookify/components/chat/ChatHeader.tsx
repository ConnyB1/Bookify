import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isSupabaseEnabled } from '../../config/supabase';
import type { ChatUser } from '../../types/chat';

interface ChatHeaderProps {
  otherUser: ChatUser;
  isOnline: boolean;
  onBack: () => void;
  onUserPress: () => void;
}

export function ChatHeader({ otherUser, isOnline, onBack, onUserPress }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.userSection} onPress={onUserPress} activeOpacity={0.7}>
        <View style={styles.avatar}>
          {otherUser.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={40} color="#8b00ff" />
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{otherUser.name || 'Chat'}</Text>
          <Text style={styles.userStatus}>
            {isSupabaseEnabled 
              ? (isOnline ? '🟢 En línea' : '⚪ Desconectado')
              : 'Mensajería activa'
            }
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
