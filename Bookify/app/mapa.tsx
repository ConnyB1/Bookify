import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MapLocationSelector } from '../components/map/SelectorUbicacionMapa';

export default function MapaScreen() {
  const { exchangeId } = useLocalSearchParams();

  return <MapLocationSelector mode="osm" exchangeId={exchangeId} />;
}
