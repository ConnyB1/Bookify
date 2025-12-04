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
  showExchangeCard?: boolean;
  onToggleExchangeCard?: () => void;
  onTogglecalificar?: () => void;
  hasExchange?: boolean;
  hasRated?: boolean;
}

export function ChatHeader({ otherUser, isOnline, onBack, onUserPress, showExchangeCard, onToggleExchangeCard, onTogglecalificar, hasExchange, hasRated }: ChatHeaderProps) {
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
            <Ionicons name="person-circle" size={44} color="#fff" />
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
      
      <View style={styles.actionsContainer}>
        {onToggleExchangeCard && (
          <TouchableOpacity 
            onPress={onToggleExchangeCard} 
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={showExchangeCard ? "swap-horizontal" : "swap-horizontal-outline"} 
              size={24} 
              color={showExchangeCard ? "#d500ff" : "#999"} 
            />
          </TouchableOpacity>
        )}
        
        {onTogglecalificar && (
          <TouchableOpacity 
            onPress={onTogglecalificar} 
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={hasRated ? "star" : "star-outline"} 
              size={24} 
              color={hasRated ? "#FFD700" : "#999"} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#151718',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d500ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: '#999',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#252525',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
