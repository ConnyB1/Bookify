import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { API_CONFIG } from '../../config/api';
import { apiClient } from '../../utils/apiClient';

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  estado: string;
  imagenes: Array<{ url_imagen: string }>;
  generos?: Array<{ id_genero: number; nombre_genero: string }>;
}

export function useBookSelection(
  exchangeId: string | string[], 
  otherUserId: string | string[],
  onSuccess?: () => void,
  onError?: (message: string) => void
) {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (otherUserId) loadBooks();
  }, [otherUserId]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Book[]>(`${API_CONFIG.ENDPOINTS.BOOKS}/user/${otherUserId}`);

      let booksArray: Book[] = [];
      if (res.ok && res.data) {
        booksArray = Array.isArray(res.data) ? (res.data as any) : (res.data as any).data || [];
      }
      const availableBooks = booksArray.filter((book) => book.estado === 'available');
      
      setBooks(availableBooks);
    } catch (error) {
      if (onError) {
        onError('No se pudieron cargar los libros');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectBook = async (bookId: number) => {
    try {
      setSelecting(true);
      const res = await apiClient.put(`/api/exchange/${exchangeId}/offer-book`, { id_libro_ofertado: bookId });

      if (res.ok && res.data) {
        if (onSuccess) {
          onSuccess();
        }
        return true;
      }

      const errMsg = res.error?.message || (res.data && (res.data as any).message) || 'Error al ofrecer libro';
      throw new Error(errMsg);
    } catch (error: any) {
      if (onError) {
        onError(error.message || 'No se pudo ofrecer el libro');
      }
      return false;
    } finally {
      setSelecting(false);
    }
  };

  return { books, loading, selecting, selectBook, reloadBooks: loadBooks };
}
