import { useState } from 'react';
import { useRouter } from 'expo-router';
import { apiClient } from '../../utils/apiClient';
import { useAlertDialog } from '../useAlertDialog';

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
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  const confirmLocation = async (locationData: LocationData) => {
    try {
      setConfirming(true);
      const res = await apiClient.post(`/api/exchange/${exchangeId}/propose-location`, locationData);

      if (res.ok && res.data) {
        showAlert('Éxito', 'Ubicación propuesta correctamente', [
          { text: 'OK', onPress: () => { hideAlert(); router.back(); } },
        ]);
        return true;
      }

      const errMsg = res.error?.message || (res.data && (res.data as any).message) || 'Error al proponer ubicación';
      throw new Error(errMsg);
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo proponer la ubicación', [
        { text: 'OK', onPress: hideAlert },
      ]);
      return false;
    } finally {
      setConfirming(false);
    }
  };

  return { confirmLocation, confirming, alertVisible, alertConfig, hideAlert };
}
