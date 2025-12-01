import { useState, useCallback, useEffect } from 'react';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface RatingData {
  promedio: number;
  total_calificaciones: number;
  calificaciones: any[];
}

export function useUserRating(userId: number | undefined) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [loadingRating, setLoadingRating] = useState(true);

  const fetchUserRating = useCallback(async () => {
    if (!userId) {
      setLoadingRating(false);
      return;
    }

    try {
      const url = buildApiUrl(`/api/rating/user/${userId}`);
      console.log('Fetching rating from:', url);
      const response = await fetch(url);

      if (!response.ok) {
        console.log('Rating fetch response not OK:', response.status);
        setRatingData(null);
        setLoadingRating(false);
        return;
      }

      const result = await response.json();
      console.log('Rating response:', result);
      
      if (result.success && result.data) {
        setRatingData(result.data);
      } else {
        setRatingData(null);
      }
    } catch (error) {
      console.log('Error fetching rating (non-critical):', error);
      setRatingData(null);
    } finally {
      setLoadingRating(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRating();
  }, [userId]);

  return { ratingData, loadingRating, fetchUserRating };
}
