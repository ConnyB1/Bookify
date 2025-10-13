import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const GENRES = [
  'Ciencia Ficción',
  'Misterio',
  'Fantasía',
  'Romance',
  'Terror',
  'Biografía',
  'Historia',
  'Aventura',
];

export default function BuscarScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Título */}
        <ThemedText style={styles.title}>Buscar</ThemedText>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca por título, autor..."
            placeholderTextColor="#666"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Sección de Géneros */}
        <View style={styles.genresSection}>
          <ThemedText style={styles.sectionTitle}>Géneros</ThemedText>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.genresContainer}
          >
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreButton,
                  selectedGenres.includes(genre) && styles.genreButtonActive
                ]}
                onPress={() => toggleGenre(genre)}
                activeOpacity={0.7}
              >
                <ThemedText 
                  style={[
                    styles.genreText,
                    selectedGenres.includes(genre) && styles.genreTextActive
                  ]}
                >
                  {genre}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 0,
  },
  genresSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  genreButtonActive: {
    backgroundColor: '#d500ff',
  },
  genreText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  genreTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});