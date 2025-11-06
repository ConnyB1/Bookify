import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = API_CONFIG.BASE_URL;

// Helper para obtener el token de autenticación
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export interface ChatPreview {
  id_chat: number;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail?: string;
  otherUserPhoto?: string;
  lastMessage: string;
  timestamp: string;
}

export interface Message {
  id_mensaje: number;
  id_chat: number;
  id_usuario_emisor: number;
  contenido_texto: string;
  timestamp: string;
  emisor?: {
    id_usuario: number;
    nombre_usuario: string;
    foto_perfil_url?: string;
  };
}

/**
 * Servicio de chat que usa el backend de NestJS
 */
class ChatService {
  private pollingIntervals: Map<number, ReturnType<typeof setInterval>> = new Map();

  /**
   * Obtener todos los chats del usuario
   */
  async getMyChats(): Promise<ChatPreview[]> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/chat/my-chats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener chats');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  /**
   * Obtener mensajes de un chat
   */
  async getChatMessages(chatId: number, limit = 200): Promise<Message[]> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(
        `${API_URL}/chat/${chatId}/messages?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener mensajes');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Enviar un mensaje
   */
  async sendMessage(chatId: number, contenido: string): Promise<Message> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_chat: chatId,
          contenido_texto: contenido,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al enviar mensaje');
      }

      return data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo chat entre dos usuarios
   */
  async createChat(otherUserId: number, intercambioId?: number): Promise<number> {
    try {
      const token = await getAuthToken();
      const userData = JSON.parse(await getAuthToken() || '{}');
      
      const response = await fetch(`${API_URL}/chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_usuario1: userData.id_usuario, // Usuario actual
          id_usuario2: otherUserId,
          id_intercambio: intercambioId,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al crear chat');
      }

      return data.data.id_chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Polling para obtener nuevos mensajes
   * Llama a este método para simular "tiempo real"
   */
  startPolling(
    chatId: number,
    onNewMessages: (messages: Message[]) => void,
    intervalMs = 3000
  ): void {
    // Detener polling anterior si existe
    this.stopPolling(chatId);

    let lastTimestamp = new Date().toISOString();

    const pollInterval = setInterval(async () => {
      try {
        const token = await getAuthToken();
        
        const response = await fetch(
          `${API_URL}/chat/${chatId}/new-messages?since=${lastTimestamp}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          onNewMessages(data.data);
          // Actualizar timestamp al más reciente
          lastTimestamp = data.data[data.data.length - 1].timestamp;
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, intervalMs);

    this.pollingIntervals.set(chatId, pollInterval);
  }

  /**
   * Detener el polling de mensajes
   */
  stopPolling(chatId: number): void {
    const interval = this.pollingIntervals.get(chatId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(chatId);
    }
  }

  /**
   * Detener todos los polling activos
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}

export const chatService = new ChatService();
