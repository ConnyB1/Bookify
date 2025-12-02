import { useState } from 'react';
import { Alert } from 'react-native';
import { buscarlugarescercanos, OSMPlace } from '../../services/openStreetMap';

interface UsePlaceSearchProps {
  onSearchComplete?: (places: OSMPlace[]) => void;
}

export function usePlaceSearch({ onSearchComplete }: UsePlaceSearchProps = {}) {
  const [places, setPlaces] = useState<OSMPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<OSMPlace | null>(null);

  const searchPlaces = async (
    lat: number,
    lng: number,
    type: string,
    radius: number = 2000
  ) => {
    try {
      setSearching(true);
      const results = await buscarlugarescercanos({
        latitude: lat,
        longitude: lng,
        radius,
        type,
      });
      setPlaces(results);
      if (onSearchComplete) onSearchComplete(results);
      return results;
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los lugares');
      return [];
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place: OSMPlace | null) => {
    setSelectedPlace(place);
  };

  const clearPlaces = () => {
    setPlaces([]);
    setSelectedPlace(null);
  };

  return {
    places,
    searching,
    selectedPlace,
    searchPlaces,
    selectPlace,
    clearPlaces,
  };
}
