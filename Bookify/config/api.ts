// Configuración de API endpoints
export const API_CONFIG = {
  // IP local de tu computadora
  BASE_URL: 'http://192.168.50.75:3000',
  
  // Endpoints
  ENDPOINTS: {
    UPLOAD_IMAGE: '/api/images/upload/book',
    BOOKS: '/api/books',
    BOOKS_BY_USER: '/api/books/user',
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Para obtener la IP correcta, ejecuta en terminal: ipconfig (Windows) o ifconfig (Mac/Linux)
// y busca la IPv4 de tu adaptador de red principal