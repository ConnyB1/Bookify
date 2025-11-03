export const API_CONFIG = {
  BASE_URL: 'http://10.41.72.78:3000', 

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