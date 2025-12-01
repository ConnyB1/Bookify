import { useState, useCallback, useEffect } from 'react';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface Libro {
  id_libro: number;
  titulo: string;
  imagenes?: { url_imagen: string }[];
}

interface UseUserBooksOptions {
  userId: number | undefined;
  onError?: (message: string) => void;
}

export function useUserBooks({ userId, onError }: UseUserBooksOptions) {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loadingLibros, setLoadingLibros] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLibros = useCallback(async () => {
    if (!userId) {
      setLoadingLibros(false);
      return;
    }

    if (!refreshing) {
      setLoadingLibros(true);
    }

    try {
      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS)}/user/${userId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('No se pudieron cargar los libros');
      }

      const result = await response.json();

      if (result && Array.isArray(result)) {
        setLibros(result);
      } else {
        setLibros([]);
      }
    } catch (error) {
      console.error('Error al cargar libros del usuario:', error);
      if (onError) {
        onError('No se pudieron cargar tus libros.');
      }
    } finally {
      setLoadingLibros(false);
    }
  }, [userId, refreshing, onError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLibros();
    setRefreshing(false);
  }, [fetchLibros]);

  useEffect(() => {
    fetchLibros();
  }, [userId]);

  return { libros, loadingLibros, refreshing, fetchLibros, onRefresh };
}
