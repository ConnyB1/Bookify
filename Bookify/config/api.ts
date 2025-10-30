// Bookify-branch2/Bookify/config/api.ts

// Configuración de API endpoints
export const API_CONFIG = {
  // IP local de tu computadora
  BASE_URL: 'http://192.168.0.102:3000', // Usa tu IP actual
  
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

// ===============================================
// DEFINICIONES DE DTO (Data Transfer Objects)
// ===============================================

// DTO para la información del Propietario (Usuario)
// Se basa en el entity Usuario, pero solo expone campos necesarios.
interface PropietarioDTO {
    id_usuario: number;
    // Se usa 'nombre' aquí asumiendo que el backend lo mapea de 'nombre_usuario'
    nombre: string; 
}

// DTO para las Imágenes del Libro
// Se basa en el entity LibroImagen.
interface ImagenDTO {
    // Se usa 'url' aquí asumiendo que el backend lo mapea de 'url_imagen'
    url: string;
}

// DTO para los Géneros
// Se basa en el entity Genero.
interface GeneroDTO {
    // El frontend solo usa el nombre en la pantalla de detalles
    nombre: string;
}

// DTO principal para un Libro
// Corresponde al entity Libro.
export interface LibroDTO {
    id_libro: number;
    titulo: string;
    autor: string;
    descripcion?: string; // Columna 'descripcion' en Libro
    
    // El estado del libro, basado en el enum EstadoLibro
    estado: 'available' | 'exchange_pending' | 'unavailable'; 
    
    // Relación ManyToOne con Propietario (Usuario)
    propietario: PropietarioDTO; 
    
    // Relación ManyToMany con Generos
    generos?: GeneroDTO[];
    
    // Relación OneToMany con Imagenes
    imagenes?: ImagenDTO[];
}