import { useState } from 'react';
import { Alert } from 'react-native';
import { buscarlugarescercanos, OSMPlace } from '../../services/openStreetMap';

interface usarbusquedaProps {
  busquedacompletada?: (places: OSMPlace[]) => void;
}

export function usarbusqueda({ busquedacompletada }: usarbusquedaProps = {}) {
  const [places, setPlaces] = useState<OSMPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<OSMPlace | null>(null);

  const buscarlugares = async (
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
      if (busquedacompletada) busquedacompletada(results);
      return results;
    } catch (error: any) {
      console.error('[usePlaceSearch] Error:', error);
      const errorMsg = error.message || 'No se pudieron cargar los lugares';
      Alert.alert('Error al buscar lugares', errorMsg);
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
    buscarlugares,
    selectPlace,
    clearPlaces,
  };
}
