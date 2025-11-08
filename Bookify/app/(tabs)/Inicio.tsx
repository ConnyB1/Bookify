import BookItem from '@/components/Bookify-componentes/comp.libro';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import FilterButtons from '@/components/filter-buttons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

interface LibroImagen {
  id_imagen: number;
  url_imagen: string;
}

interface Genero {
  id_genero: number;
  nombre: string;
}

interface Book {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  imagenes?: LibroImagen[];
  generos?: Genero[];
  isFavorite?: boolean;
  id_propietario?: number;
}

export default function InicioScreen() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); 
  const { user } = useAuth(); 
  
  const filteredBooks = useMemo(() => {
    console.log('[DEBUG] Current filter:', currentFilter);
    console.log('[DEBUG] Total books:', books.length);
    console.log('[DEBUG] Current user ID:', user?.id_usuario);
    
    // Primero filtrar los libros que NO son del usuario actual
    const booksNotOwned = books.filter(book => {
      const isNotOwner = book.id_propietario !== user?.id_usuario;
      if (!isNotOwner) {
        console.log('[DEBUG] Filtrando libro propio:', book.titulo, 'ID propietario:', book.id_propietario);
      }
      return isNotOwner;
    });
    
    console.log('[DEBUG] Books after filtering owner:', booksNotOwned.length);
    
    switch (currentFilter) {
      case 'favorites':
        const favorites = booksNotOwned.filter(book => book.isFavorite);
        console.log('[DEBUG] Favorites count:', favorites.length);
        return favorites;
      case 'all':
      default:
        console.log('[DEBUG] Showing all books (except user\'s own)');
        return booksNotOwned;
    }
  }, [currentFilter, books, user?.id_usuario]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS);
      console.log('[DEBUG] Fetching books from URL:', url);
      
      const response = await fetch(url);
      console.log('[DEBUG] Response status:', response.status);
      console.log('[DEBUG] Response headers:', response.headers);
      
      const textResponse = await response.text();
      console.log('[DEBUG] Raw response:', textResponse.substring(0, 200));
      
      const result = JSON.parse(textResponse);
      console.log('[DEBUG] Response from API:', result);
      
      if (result.success && result.data) {
        console.log('[DEBUG] Books received:', result.data);
        console.log('[DEBUG] First book images:', result.data[0]?.imagenes);
        setBooks(result.data);
      } else {
        console.error('Error fetching books:', result.message);
        Alert.alert('Error', 'No se pudieron cargar los libros');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      Alert.alert('Error', 'Error de conexión al cargar los libros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  const handleFilterChange = (filterId: string) => {
    setCurrentFilter(filterId);
  };
  
  const handleBookInfoPress = (bookId: number) => {
    router.push(`/libro/${bookId}`); 
  };


  return (
    <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
        {/* Encabezado */}
        <Header />

        {/* Filtros */}
        <FilterButtons 
          onFilterChange={handleFilterChange}
          initialFilter={currentFilter}
        />

        {/* Lista de Libros */}
        {loading ? (
          <ActivityIndicator size="large" color="#d500ff" style={styles.loader} />
        ) : filteredBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={80} color="#666" />
            <ThemedText style={styles.emptyTitle}>
              {currentFilter === 'favorites' ? 'Sin favoritos' : 'No hay libros disponibles'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {currentFilter === 'favorites' 
                ? 'Aún no has marcado ningún libro como favorito' 
                : 'Desliza hacia abajo para actualizar'}
            </ThemedText>
          </View>
        ) : (
          <>
            {console.log('[DEBUG] Rendering FlatList with', filteredBooks.length, 'books')}
            <FlatList
              data={filteredBooks}
              renderItem={({ item }) => {
                console.log('[DEBUG] Rendering book:', item.titulo);
                return (
                  <BookItem 
                    id={item.id_libro} 
                    title={item.titulo} 
                    image={item.imagenes && item.imagenes.length > 0 ? item.imagenes[0].url_imagen : 'https://via.placeholder.com/150x200?text=Sin+Imagen'} 
                    genres={item.generos?.map(g => g.nombre) || []}
                    onInfoPress={handleBookInfoPress}
                  />
                );
              }}
              keyExtractor={(item) => item.id_libro.toString()}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={styles.row}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#d500ff']} 
                  tintColor="#d500ff" 
                  title="Actualizando libros..." 
                  titleColor="#d500ff"
                />
              }
            />
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718', // dark.background
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});