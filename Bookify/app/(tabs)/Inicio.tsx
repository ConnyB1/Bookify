import BookItem from '@/components/Bookify-componentes/comp.libro';
// Usar importación con nombre (Header) corregida anteriormente
import { Header } from '@/components/Bookify-componentes/Encabezadobook'; 
import FilterButtons from '@/components/filter-buttons';
import { ThemedView } from '@/components/themed-view';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  FlatList, 
  StyleSheet,
  Text, // Importación clave: necesario para mostrar texto en el estado de carga
} from 'react-native';
// Importación clave: usar el componente SafeAreaView del paquete correcto
import { SafeAreaView } from 'react-native-safe-area-context'; 
import axios from 'axios';

// Interfaz para la respuesta de la API (ajustada a la respuesta de NestJS)
interface Libro {
  id: string; // Usaremos id_libro como string para keyExtractor
  titulo: string;
  autor: string;
  image: string; // URL de imagen simulada
  isFavorite: boolean;
  // id_libro, estado, descripcion, etc., se incluyen en el objeto original
}


export default function InicioScreen() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [books, setBooks] = useState<Libro[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 

  const fetchBooks = useCallback(async () => {
    try {
      const YOUR_API_URL = 'http://192.168.0.102:3000/books';
      
      console.log(`Intentando conectar a: ${YOUR_API_URL}`);

      const response = await axios.get(YOUR_API_URL); 
      
      const fetchedBooks: Libro[] = response.data.map((book: any) => ({
        id: book.id_libro ? book.id_libro.toString() : Math.random().toString(),
        title: book.titulo || 'Título Desconocido',
        // Usar una imagen de marcador de posición temporal ya que la DB solo tiene texto
        image: 'https://placehold.co/400x600/6A5ACD/ffffff?text=Bookify', 
        isFavorite: book.id_propietario === 1,
      }));
      
      setBooks(fetchedBooks);
      setError(null);
    } catch (err) {
      console.error("Error al cargar libros:", err);
      // Mostrar un mensaje de error útil en la aplicación móvil
      setError('Error 404/Network: Asegúrate de que el backend (NestJS) esté corriendo y la IP sea correcta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);


  const filteredBooks = useMemo(() => {
    if (loading) return [];
    
    switch (currentFilter) {
      case 'favorites':
        return books.filter(book => book.isFavorite);
      case 'all':
      default:
        return books;
    }
  }, [currentFilter, books, loading]);

  const handleFilterChange = (filterId: string) => {
    setCurrentFilter(filterId);
  };

  if (loading) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.container}>
            <Header />
            <Text style={styles.messageText}>Cargando libros desde la API...</Text>
          </ThemedView>
        </SafeAreaView>
      );
  }
  
  if (error) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.container}>
            <Header />
            <Text style={styles.errorText}>Error de Conexión:</Text>
            <Text style={styles.errorDetailText}>{error}</Text>
          </ThemedView>
        </SafeAreaView>
      );
  }

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
        <FlatList
          data={filteredBooks}
          renderItem={({ item }) => <BookItem title={item.title} image={item.image} />} 
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
        />
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
  messageText: {
    color: '#a0aec0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  errorDetailText: {
    color: '#E53E3E',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
});
