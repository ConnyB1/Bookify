import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../utils/apiClient';

interface LocationData {
  lat: number;
  lng: number;
  nombre: string;
  direccion: string;
  place_id?: string | null;
}

export function useLocationConfirmation(exchangeId: string | string[]) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const confirmLocation = async (locationData: LocationData) => {
    try {
      setConfirming(true);
      const res = await apiClient.post(`/api/exchange/${exchangeId}/propose-location`, locationData);

      if (res.ok && res.data) {
        // assume success flag or general success
        Alert.alert('Éxito', 'Ubicación propuesta correctamente', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return true;
      }

      const errMsg = res.error?.message || (res.data && (res.data as any).message) || 'Error al proponer ubicación';
      throw new Error(errMsg);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo proponer la ubicación');
      return false;
    } finally {
      setConfirming(false);
    }
  };

  return { confirmLocation, confirming };
}
