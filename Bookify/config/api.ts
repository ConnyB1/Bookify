const DEFAULT_API = 'http://192.168.0.101:3000' //'http://10.41.72.78:3000'; //'http://192.168.50.75:3000'

export const API_CONFIG = {
  // Usa la variable de entorno EXPO_PUBLIC_API_URL si está definida (útil para Expo en dispositivo),
  // si no, usa el valor por defecto configurado.
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API,

  ENDPOINTS: {
    UPLOAD_IMAGE: '/api/images/upload/book',
    BOOKS: '/api/books',
    BOOKS_BY_USER: '/api/books/user',
    // Auth endpoints
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    CONFIRM_EMAIL: '/api/auth/confirm',
    RESEND_CODE: '/api/auth/resend-code',
    GET_PROFILE: '/api/auth/me',
    // Exchange endpoints
    EXCHANGE_REQUEST: '/api/exchange/request',
    EXCHANGE_RECEIVED: '/api/exchange/received',
    EXCHANGE_SENT: '/api/exchange/sent',
    // Notifications endpoints
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/api/notifications/unread-count',

    UPLOAD_PROFILE_IMAGE: '/api/images/upload/profile', // Para subir el archivo
    UPDATE_PROFILE_PICTURE: '/api/auth/profile/picture', // Para guardar la URL
  }
};

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

interface PropietarioDTO {
    id_usuario: number;
    nombre: string; 
}

interface ImagenDTO {
    url: string;
}

interface GeneroDTO {
    nombre: string;
}

export interface LibroDTO {
    id_libro: number;
    titulo: string;
    autor: string;
    descripcion?: string; 
    
    estado: 'available' | 'exchange_pending' | 'unavailable'; 
    
    propietario: PropietarioDTO; 
    
    generos?: GeneroDTO[];
    
    imagenes?: ImagenDTO[];
}