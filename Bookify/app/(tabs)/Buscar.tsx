import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import LocationRequiredScreen from '@/components/LocationRequiredScreen';
import SearchBar from '@/components/SearchBar';
import GenreSelector from '@/components/Bookify-componentes/GenreSelector';
import SearchResults from '@/components/Bookify-componentes/SearchResults';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBookSearch } from '../../hooks/useBookSearch';
import { GENRES } from '../../constants/search';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuscarScreen() {
  const {
    searchText,
    setSearchText,
    selectedGenres,
    books,
    loading,
    toggleGenre,
    refetch,
  } = useBookSearch();

  return (
    <LocationRequiredScreen>
      <SafeAreaView style={styles.safeArea}>
        
        <ThemedView style={styles.container}>
          {/* <Header /> descomentar si queremos bookify emasol */}
          <View style={styles.header}>
            
            <ThemedText style={styles.title}>Buscar</ThemedText>
          </View>
          
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Busca por título, autor..."
          />

          <GenreSelector
            genres={GENRES}
            selectedGenres={selectedGenres}
            onGenreToggle={toggleGenre}
          />

          <SearchResults
            books={books}
            loading={loading}
            searchText={searchText}
            selectedGenres={selectedGenres}
          />
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});