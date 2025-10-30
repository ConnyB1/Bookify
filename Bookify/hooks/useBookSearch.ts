import { useState, useEffect, useMemo } from 'react';
import { API_CONFIG, buildApiUrl } from '../config/api';

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  imagenes?: { id_imagen: number; url_imagen: string; }[];
  generos?: { id_genero: number; nombre: string; }[];
}

export const useBookSearch = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Función para obtener todos los libros
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS));
      const result = await response.json();
      
      if (result.success && result.data) {
        setBooks(result.data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar libros al inicio
  useEffect(() => {
    fetchBooks();
  }, []);

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