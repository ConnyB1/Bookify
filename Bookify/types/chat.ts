/**
 * Tipos para el sistema de chat
 */

export interface Message {
  id_mensaje: number;
  id_chat: number;
  id_usuario_emisor: number;
  contenido_texto: string;
  timestamp: string;
  emisor: {
    id_usuario: number;
    nombre_usuario: string;
    foto_perfil_url?: string;
  };
}

export interface ChatUser {
  id: number;
  name: string;
  photo?: string;
}

export interface ChatParams {
  chatId: number;
  otherUser: ChatUser;
}

export interface PresenceState {
  isOnline: boolean;
  onlineUsers: number[];
}
