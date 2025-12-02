import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export function useUbicacionUsuario() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const errorMsg = 'Permiso de ubicación denegado';
        setError(errorMsg);
        Alert.alert('Permiso Denegado', 'Necesitamos tu ubicación');
        return null;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      setLocation(userLocation);
      return userLocation;
    } catch (err) {
      const errorMsg = 'No se pudo obtener tu ubicación';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  return { location, loading, error, reload: loadLocation };
}
