import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import BookItem from './comp.libro';
import { useRouter } from 'expo-router';

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  imagenes?: { id_imagen: number; url_imagen: string; }[];
  generos?: { id_genero: number; nombre: string; }[];
  distancia_km?: number;
}

interface SearchResultsProps {
  books: Book[];
  loading: boolean;
  searchText: string;
  selectedGenres: string[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  books,
  loading,
  searchText,
  selectedGenres
}) => {
  const router = useRouter();

  const handleBookInfoPress = (bookId: number) => {
    router.push(`/libro/${bookId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d500ff" />
        <ThemedText style={styles.loadingText}>Buscando libros...</ThemedText>
      </View>
    );
  }

  if (books.length === 0 && (searchText || selectedGenres.length > 0)) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          No se encontraron libros que coincidan con tu búsqueda
        </ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Intenta con otros términos o géneros
        </ThemedText>
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          Busca libros por título, autor o selecciona géneros
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.resultsContainer}>
      <ThemedText style={styles.resultsTitle}>
        {books.length} libro{books.length !== 1 ? 's' : ''} encontrado{books.length !== 1 ? 's' : ''}
      </ThemedText>
      
      <FlatList
        data={books}
        renderItem={({ item }) => (
          <BookItem 
            id={item.id_libro}
            title={item.titulo} 
            image={item.imagenes && item.imagenes.length > 0 ? item.imagenes[0].url_imagen : 'https://via.placeholder.com/150x200?text=Sin+Imagen'}
            genres={item.generos?.map(g => g.nombre) || []}
            distance={item.distancia_km}
            onInfoPress={handleBookInfoPress}
          />
        )}
        keyExtractor={(item) => item.id_libro.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 280, // Approximate height of BookItem
          offset: 280 * Math.floor(index / 2),
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#d500ff',
  },
  listContainer: {
    paddingBottom: 100, // Espacio extra para que no tape la barra de navegación
  },
  row: {
    justifyContent: 'space-between',
  },
});

export default SearchResults;