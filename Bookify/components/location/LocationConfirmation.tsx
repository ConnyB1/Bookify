import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OSMPlace } from '../../services/openStreetMap';

interface LocationConfirmationProps {
  selectedPlace: OSMPlace;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function LocationConfirmation({ selectedPlace, onConfirm, onCancel, loading }: LocationConfirmationProps) {
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      {/* Botón cerrar */}
      {onCancel && (
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close-circle" size={32} color="#d500ff" />
        </TouchableOpacity>
      )}

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
      
      {loading ? (
        <TouchableOpacity style={[styles.btn, styles.btnDisabled]} disabled={true}>
          <ActivityIndicator color="#fff" />
        </TouchableOpacity>
      ) : (
        <LinearGradient
          colors={['#6100BD', '#D500FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <TouchableOpacity style={styles.btnContent} onPress={onConfirm}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.btnText}>Confirmar Ubicación</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  info: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f9f0ff', borderRadius: 8 },
  textContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  address: { fontSize: 13, color: '#666', marginBottom: 4 },
  distance: { fontSize: 12, color: '#d500ff', fontWeight: '600' },
  btn: { 
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: {
    backgroundColor: '#555',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  btnText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#fff' },
});
