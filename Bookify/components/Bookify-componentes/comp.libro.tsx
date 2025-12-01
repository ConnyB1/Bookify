import { ThemedText } from '@/components/themed-text';
import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GenreChip from './GenreChip';

interface BookItemProps {
    id: number;
    title: string;
    image: string;
    genres?: string[];
    distance?: number;
    onInfoPress: (id: number) => void;
}

// Función para determinar el rango de distancia
const getDistanceRange = (distance: number): string => {
  if (distance <= 5) return '< 5';
  if (distance <= 10) return '< 10';
  if (distance <= 20) return '< 20';
  if (distance <= 50) return '< 50';
  return '> 50';
};

// Componente para cada elemento de libro en la lista
const BookItem = ({ id, title, image, genres = [], distance, onInfoPress }: BookItemProps) => (
  <View style={styles.bookContainer}>
    <TouchableOpacity onPress={() => onInfoPress(id)}>
      {distance !== undefined && (
        <View style={styles.distanceBadge}>
          <Ionicons name="location" size={12} color="#d500ff" />
          <Text style={styles.distanceText}>
            {getDistanceRange(distance)} km
          </Text>
        </View>
      )}
      <Image source={{ uri: image }} style={styles.bookImage} />
      <ThemedText style={styles.bookTitle} numberOfLines={2}>{title}</ThemedText>
      {genres.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.genresContainer}
          contentContainerStyle={styles.genresContent}
        >
          {genres.slice(0, 2).map((genre, index) => (
            <GenreChip 
              key={index} 
              genre={genre} 
              size="small"
              variant="filled"
            />
          ))}
          {genres.length > 2 && (
            <View style={styles.moreGenres}>
              <ThemedText style={styles.moreGenresText}>+{genres.length - 2}</ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bookContainer: {
    flex: 1,
    margin: 8,
    maxWidth: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#d500ff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    gap: 4,
  },
  distanceText: {
    color: '#d500ff',
    fontSize: 11,
    fontWeight: '600',
  },
  bookImage: {
    width: 130,
    height: 190,
    borderRadius: 12,
    marginBottom: 12,
  },
  bookTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
    color: '#fff',
  },
  genresContainer: {
    maxHeight: 30,
    marginBottom: 8,
  },
  genresContent: {
    alignItems: 'center',
  },
  moreGenres: {
    backgroundColor: '#444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreGenresText: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BookItem;
