import BookItem from '@/components/Bookify-componentes/comp.libro';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import FilterButtons from '@/components/filter-buttons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import LocationRequiredScreen from '@/components/LocationRequiredScreen';
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
import { useFocusEffect } from '@react-navigation/native';

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
  distancia_km?: number;
}

export default function InicioScreen() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userGenrePreferences, setUserGenrePreferences] = useState<number[]>([]);
  const router = useRouter(); 
  const { user } = useAuth(); 
  
  const filteredBooks = useMemo(() => {
    const booksNotOwned = books.filter(book => book.id_propietario !== user?.id_usuario);
    
    switch (currentFilter) {
      case 'for-you':
        if (userGenrePreferences.length === 0) {
          return [];
        }
        
        return booksNotOwned.filter(book => 
          book.generos?.some(genero => userGenrePreferences.includes(genero.id_genero))
        );
      case 'all':
      default:
        return booksNotOwned;
    }
  }, [currentFilter, books, user?.id_usuario, userGenrePreferences]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const queryParam = user?.id_usuario ? `?userId=${user.id_usuario}` : '';
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS + queryParam);
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
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
    loadUserGenrePreferences();
  }, [user?.id_usuario]);

  useFocusEffect(
    React.useCallback(() => {
      loadUserGenrePreferences();
    }, [user?.id_usuario])
  );

  const loadUserGenrePreferences = async () => {
    if (!user?.id_usuario) {
      return;
    }
    
    try {
      const url = buildApiUrl(`/users/${user.id_usuario}/genre-preferences`);
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        const genreIds = result.data.genreIds || [];
        setUserGenrePreferences(genreIds);
      } else {
        setUserGenrePreferences([]);
      }
    } catch (error) {
      console.error('Error loading genre preferences:', error);
      setUserGenrePreferences([]);
    }
  };

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
    <LocationRequiredScreen>
      <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.container}>
            
          
          <Header />

          {/* Filtros */}
          <FilterButtons 
            onFilterChange={handleFilterChange}
            initialFilter={currentFilter}
          />

          {/* Lista de los libros */}
          {loading ? (
            <ActivityIndicator size="large" color="#d500ff" style={styles.loader} />
            
          ) : filteredBooks.length === 0 ? (

            <View style={styles.emptyState}>
              
              <Ionicons name="book-outline" size={80} color="#666" />
              <ThemedText style={styles.emptyTitle}>
                {currentFilter === 'for-you'
                  ? 'No hay libros para ti'
                  : 'No hay libros disponibles'}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {currentFilter === 'for-you'
                  ? userGenrePreferences.length === 0
                    ? 'Configura tus preferencias de géneros en tu perfil'
                    : 'No hay libros disponibles de tus géneros favoritos'
                  : 'Desliza hacia abajo para actualizar'}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredBooks}
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
              columnWrapperStyle={{justifyContent: 'flex-start'}}
              contentContainerStyle={styles.listContainer}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={10}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 280, 
                offset: 280 * Math.floor(index / 2),
                index,
              })}
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
          )}
        </ThemedView>
      </SafeAreaView>
    </LocationRequiredScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718', 
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listContainer: {
    paddingBottom: 350, 
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