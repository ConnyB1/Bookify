import { useState, useEffect, useMemo } from 'react';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { useAuth } from '@/contexts/AuthContext';

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  imagenes?: { id_imagen: number; url_imagen: string; }[];
  generos?: { id_genero: number; nombre: string; }[];
  id_propietario?: number;
  distancia_km?: number;
}

export const useBookSearch = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Función para obtener libros dentro del rango del usuario
  const fetchBooks = async () => {
    try {
      setLoading(true);
      // Pasar userId si existe para filtrar por proximidad
      const queryParam = user?.id_usuario ? `?userId=${user.id_usuario}` : '';
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS + queryParam);
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Filtrar libros que no sean del usuario actual
        const booksNotOwned = result.data.filter(
          (book: Book) => book.id_propietario !== user?.id_usuario
        );
        setBooks(booksNotOwned);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar libros al inicio y cuando cambie el usuario
  useEffect(() => {
    if (user?.id_usuario) {
      fetchBooks();
    }
  }, [user?.id_usuario]);

  // Función para alternar géneros
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Filtrar libros basado en texto de búsqueda y géneros seleccionados
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Filtrar por texto de búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(book => 
        book.titulo.toLowerCase().includes(searchLower) ||
        book.autor.toLowerCase().includes(searchLower) ||
        book.descripcion?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por géneros seleccionados
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(book => 
        book.generos?.some(genre => 
          selectedGenres.includes(genre.nombre)
        )
      );
    }

    return filtered;
  }, [books, searchText, selectedGenres]);

  const clearSearch = () => {
    setSearchText('');
    setSelectedGenres([]);
  };

  return {
    books: filteredBooks,
    allBooks: books,
    loading,
    searchText,
    setSearchText,
    selectedGenres,
    toggleGenre,
    clearSearch,
    refetch: fetchBooks
  };
};