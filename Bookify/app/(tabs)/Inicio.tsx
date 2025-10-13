import BookItem from '@/components/Bookify-componentes/comp.libro';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import FilterButtons from '@/components/filter-buttons';
import { ThemedView } from '@/components/themed-view';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

const BOOKS = [
  {
    id: '1',
    title: 'Pinocho',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Don Quijote de la Mancha',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: false,
  },
  {
    id: '3',
    title: 'El Señor de los Anillos',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Alicia en el país de las maravillas',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: false,
  },
  {
    id: '5',
    title: 'La Sombra del Viento',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: true,
  },
  {
    id: '6',
    title: 'Cien Años de Soledad',
    image: 'https://ibb.co/ZpBMfmj9',
    isFavorite: false,
  },
];


export default function InicioScreen() {
  const [currentFilter, setCurrentFilter] = useState('all');
  
  const filteredBooks = useMemo(() => {
    switch (currentFilter) {
      case 'favorites':
        return BOOKS.filter(book => book.isFavorite);
      case 'all':
      default:
        return BOOKS;
    }
  }, [currentFilter]);

  const handleFilterChange = (filterId: string) => {
    setCurrentFilter(filterId);
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
});