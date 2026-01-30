import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { getGenreColor } from '../../utils/genreColors';

interface GenreSelectorProps {
  genres: string[];
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  title?: string;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({
  genres,
  selectedGenres,
  onGenreToggle,
  title = "Géneros"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.genresSection}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.titleContainer}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {selectedGenres.length > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{selectedGenres.length}</ThemedText>
            </View>
          )}
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#ccc" 
          style={styles.chevronIcon}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.genresContainer}
        >
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreButton,
                selectedGenres.includes(genre) && {
                  backgroundColor: getGenreColor(genre),
                  borderColor: getGenreColor(genre),
                }
              ]}
              onPress={() => onGenreToggle(genre)}
              activeOpacity={0.7}
            >
              <ThemedText 
                style={[
                  styles.genreText,
                  selectedGenres.includes(genre) && {
                    color: 'white',
                    fontWeight: 'bold',
                  }
                ]}
              >
                {genre}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  genresSection: {
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#d500ff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 4,
  },
  genreButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  genreText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GenreSelector;