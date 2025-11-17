import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MapLocationSelector } from '../components/map/MapLocationSelector';

export default function SimpleMeetingLocationScreen() {
  const { exchangeId } = useLocalSearchParams();

  return <MapLocationSelector mode="manual" exchangeId={exchangeId} />;
}
