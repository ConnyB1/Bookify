import { ThemedText } from '@/components/themed-text';
import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface BookItemProps {
    id: number;
    title: string;
    image: string;
    onInfoPress: (id: number) => void;
}

const BookItem = ({ id, title, image, onInfoPress }: BookItemProps) => (
  <View style={styles.bookContainer}>
    <Image source={{ uri: image }} style={styles.bookImage} />
    <ThemedText style={styles.bookTitle}>{title}</ThemedText>
    <TouchableOpacity 
      style={styles.infoButton}
      onPress={() => onInfoPress(id)} 
    >
      <ThemedText style={styles.infoButtonText}>Información</ThemedText>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bookContainer: {
    flex: 1,
    margin: 8,
    maxWidth: '46%', // Para asegurar que haya espacio entre las dos columnas
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
    marginBottom: 10,
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