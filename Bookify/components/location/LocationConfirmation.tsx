import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OSMPlace } from '../../services/openStreetMap';

interface LocationConfirmationProps {
  selectedPlace: OSMPlace;
  onConfirm: () => void;
  loading?: boolean;
}

export function LocationConfirmation({ selectedPlace, onConfirm, loading }: LocationConfirmationProps) {
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Ionicons name="location" size={24} color="#d500ff" />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{selectedPlace.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{selectedPlace.display_name}</Text>
          {selectedPlace.distance && (
            <Text style={styles.distance}>
              📍 {formatDistance(selectedPlace.distance)}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onConfirm} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.btnText}>Confirmar Ubicación</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  info: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f9f0ff', borderRadius: 8 },
  textContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  address: { fontSize: 13, color: '#666', marginBottom: 4 },
  distance: { fontSize: 12, color: '#d500ff', fontWeight: '600' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#d500ff', borderRadius: 12 },
  btnText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#fff' },
});
