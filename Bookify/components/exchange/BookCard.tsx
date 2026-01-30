import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion: string;
  estado: string;
  imagenes: Array<{ url_imagen: string }>;
}

interface BookCardProps {
  book: Book;
  onPress: () => void;
  disabled?: boolean;
}

export function BookCard({ book, onPress, disabled }: BookCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={disabled}>
      <Image
        source={{
          uri: book.imagenes?.[0]?.url_imagen || 'https://via.placeholder.com/100x150/333/fff?text=Sin+Imagen',
        }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.titulo}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.autor}</Text>
        {book.descripcion && (
          <Text style={styles.description} numberOfLines={2}>{book.descripcion}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#d500ff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  image: { width: 60, height: 90, borderRadius: 4, backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  author: { fontSize: 14, color: '#999', marginBottom: 4 },
  description: { fontSize: 12, color: '#666', marginTop: 4 },
});
