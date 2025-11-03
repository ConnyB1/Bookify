import { ThemedText } from '@/components/themed-text';
import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import GenreChip from './GenreChip';
interface BookItemProps {
    id: number;
    title: string;
    image: string;
    genres?: string[];
    onInfoPress: (id: number) => void;
}
// Componente para cada elemento de libro en la lista
const BookItem = ({ id, title, image, genres = [], onInfoPress }: BookItemProps) => (
  <View style={styles.bookContainer}>
    <TouchableOpacity onPress={() => onInfoPress(id)}>
    <Image source={{ uri: image }} style={styles.bookImage} />
    <ThemedText style={styles.bookTitle}>{title}</ThemedText>
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
    maxWidth: '100%', // Para asegurar que haya espacio entre las dos columnas
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 10,
  },
  bookImage: {
    width: 150,
    height: 220,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
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
  infoButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  infoButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default BookItem;