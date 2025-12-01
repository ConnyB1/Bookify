import { useState, useCallback } from 'react';
import { buildApiUrl } from '@/config/api';

export function useGenrePreferences(userId: number | undefined) {
  const [userGenrePreferences, setUserGenrePreferences] = useState<number[]>([]);

  const loadUserGenrePreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}/genre-preferences`));
      const result = await response.json();
      
      if (result.success && result.data) {
        setUserGenrePreferences(result.data.genreIds || []);
      }
    } catch (error) {
      console.error('Error cargando preferencias de géneros:', error);
    }
  }, [userId]);

  const saveGenrePreferences = useCallback(async (
    selectedGenres: number[],
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    if (!userId) return;

    try {
      const response = await fetch(buildApiUrl(`/users/${userId}/genre-preferences`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreIds: selectedGenres }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUserGenrePreferences(selectedGenres);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      if (onError) {
        onError('No se pudieron guardar tus preferencias');
      }
    }
  }, [userId]);

  return {
    userGenrePreferences,
    loadUserGenrePreferences,
    saveGenrePreferences,
  };
}
