import BookItem from '@/components/Bookify-componentes/comp.libro';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import FilterButtons from '@/components/filter-buttons';
import { ThemedView } from '@/components/themed-view';
import React, { useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { useRouter } from 'expo-router';

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
}

export default function InicioScreen() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); // 🛑 AÑADIDO: Inicializar el router
  
  const filteredBooks = useMemo(() => {
    switch (currentFilter) {
      case 'favorites':
        return books.filter(book => book.isFavorite);
      case 'all':
      default:
        return books;
    }
  }, [currentFilter, books]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS));
      const result = await response.json();
      
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
  
  // 🛑 FUNCIÓN CRÍTICA: Manejar el click y navegar 🛑
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
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={({ item }) => (
              <BookItem 
                id={item.id_libro} // 🛑 AÑADIDO: Pasar el ID para la navegación
                title={item.titulo} 
                image={item.imagenes && item.imagenes.length > 0 ? item.imagenes[0].url_imagen : 'https://via.placeholder.com/150x200?text=Sin+Imagen'} 
                genres={item.generos?.map(g => g.nombre) || []}
                onInfoPress={handleBookInfoPress}
              />
            )}
            keyExtractor={(item) => item.id_libro.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#d500ff']} // Android
                tintColor="#d500ff" // iOS
                title="Actualizando libros..." // iOS
                titleColor="#d500ff" // iOS
              />
            }
          />
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
});