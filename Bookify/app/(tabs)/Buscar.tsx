import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import LocationRequiredScreen from '@/components/LocationRequiredScreen';
import SearchBar from '@/components/SearchBar';
import GenreSelectorModal from '@/components/Bookify-componentes/GenreSelectorModal';
import SearchResults from '@/components/Bookify-componentes/SearchResults';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useBookSearch } from '../../hooks/useBookSearch';
import { GENRES } from '../../constants/search';
import Header from '@/components/Bookify-componentes/Encabezadobook';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuscarScreen() {
  const [showGenreModal, setShowGenreModal] = useState(false);
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
            onFilterPress={() => setShowGenreModal(true)}
            hasActiveFilters={selectedGenres.length > 0}
          />

          <SearchResults
            books={books}
            loading={loading}
            searchText={searchText}
            selectedGenres={selectedGenres}
          />
        </ThemedView>

        <GenreSelectorModal
          visible={showGenreModal}
          genres={GENRES}
          selectedGenres={selectedGenres}
          onGenreToggle={toggleGenre}
          onClose={() => setShowGenreModal(false)}
        />
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