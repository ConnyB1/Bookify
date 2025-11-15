import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import { useChatListener } from '../../hooks/useChatListener';

interface ChatPreview {
  id_chat: number;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
  otherUserPhoto?: string;
  lastMessage: string;
  timestamp: string;
}

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Listener para nuevos chats
  const handleNewChat = useCallback(() => {
    console.log('🆕 [Chat List] Nuevo chat detectado, recargando...');
    loadChats();
  }, []);

  const { isListening } = useChatListener({
    userId: user?.id_usuario || 0,
    onNewChat: handleNewChat,
  });

  useEffect(() => {
    if (user) {
      loadChats();
      // No polling automático - el usuario actualiza con pull-to-refresh
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const loadChats = async () => {
    if (!user) return;

    try {
      console.log(`🔍 [Chat List] Cargando chats para usuario ${user.id_usuario}`);
      
      const response = await fetch(
        buildApiUrl(`/chat/my-chats?userId=${user.id_usuario}`)
      );
      
      console.log(`📡 [Chat List] Response status:`, response.status);
      
      if (!response.ok) {
        throw new Error('Error al cargar chats');
      }

      const result = await response.json();
      
      console.log(`📦 [Chat List] Result:`, JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log(`✅ [Chat List] ${result.data.length} chats encontrados`);
        setChats(result.data);
      } else {
        console.log(`⚠️ [Chat List] Sin datos o error:`, result.message);
      }
    } catch (error) {
      console.error('❌ [Chat List] Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChatItem = ({ item }: { item: ChatPreview }) => {
    const timeAgo = getTimeAgo(item.timestamp);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id_chat}?userName=${encodeURIComponent(item.otherUserName)}&otherUserId=${item.otherUserId}&otherUserPhoto=${encodeURIComponent(item.otherUserPhoto || '')}`)}
      >
        <View style={styles.avatar}>
          {item.otherUserPhoto ? (
            <Image source={{ uri: item.otherUserPhoto }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={55} />
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.otherUserName}</Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageTime.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d500ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No autenticado</Text>
          <Text style={styles.emptyText}>
            Inicia sesión para ver tus chats
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        {chats.length > 0 && (
          <Text style={styles.headerSubtitle}>{chats.length} conversación{chats.length !== 1 ? 'es' : ''}</Text>
        )}
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#444" />
          <Text style={styles.emptyTitle}>Sin chats</Text>
          <Text style={styles.emptyText}>
            Aún no tienes conversaciones.{'\n'}
            Acepta una solicitud de intercambio para empezar a chatear.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#8b00ff" />
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id_chat.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#d500ff']}
              tintColor="#d500ff"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718', // Mismo color que otras pantallas
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#151718',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#151718',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  refreshButtonText: {
    color: '#d500ff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#151718',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#d500ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
});
