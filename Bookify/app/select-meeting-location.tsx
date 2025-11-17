import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MapLocationSelector } from '../components/map/MapLocationSelector';

export default function SelectMeetingLocationScreen() {
  const { exchangeId } = useLocalSearchParams();

  return <MapLocationSelector mode="osm" exchangeId={exchangeId} />;
}

