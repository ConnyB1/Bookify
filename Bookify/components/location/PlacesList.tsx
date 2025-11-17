import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OSMPlace } from '../../services/openStreetMap';

interface PlacesListProps {
  places: OSMPlace[];
  selectedPlace: OSMPlace | null;
  onSelectPlace: (place: OSMPlace) => void;
}

export function PlacesList({ places, selectedPlace, onSelectPlace }: PlacesListProps) {
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cercanos ({places.length})</Text>
      <FlatList
        data={places}
        keyExtractor={(item) => item.place_id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, selectedPlace?.place_id === item.place_id && styles.cardSelected]}
            onPress={() => onSelectPlace(item)}
          >
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {item.distance && (
                <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
              )}
            </View>
            <Text style={styles.address} numberOfLines={2}>{item.display_name}</Text>
            {selectedPlace?.place_id === item.place_id && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={16} color="#d500ff" />
                <Text style={styles.badgeText}>Seleccionado</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'transparent', paddingHorizontal: 16 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  card: {
    width: 220,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSelected: { borderColor: '#d500ff', backgroundColor: '#f9f0ff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: '#333' },
  distance: { marginLeft: 8, fontSize: 12, fontWeight: '600', color: '#666' },
  address: { fontSize: 12, color: '#666', lineHeight: 16, marginBottom: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  badgeText: { marginLeft: 4, fontSize: 12, fontWeight: '600', color: '#d500ff' },
});
