import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { getGenreColor } from '../utils/genreColors';

type FilterOption = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isGenre?: boolean;
};

const defaultFilterOptions: FilterOption[] = [
  { id: 'all', label: 'All Titles', icon: 'apps' },
  { id: 'favorites', label: 'For You', icon: 'heart' },
];

const genreFilterOptions: FilterOption[] = [
  { id: 'Ciencia Ficción', label: 'Ciencia Ficción', isGenre: true },
  { id: 'Misterio', label: 'Misterio', isGenre: true },
  { id: 'Fantasía', label: 'Fantasía', isGenre: true },
  { id: 'Romance', label: 'Romance', isGenre: true },
  { id: 'Terror', label: 'Terror', isGenre: true },
  { id: 'Biografía', label: 'Biografía', isGenre: true },
  { id: 'Historia', label: 'Historia', isGenre: true },
  { id: 'Aventura', label: 'Aventura', isGenre: true },
];

interface FilterButtonsProps {
  onFilterChange?: (filterId: string) => void;
  initialFilter?: string;
  showGenres?: boolean;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  onFilterChange, 
  initialFilter = 'all',
  showGenres = false
}) => {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  
  const filterOptions = showGenres 
    ? [...defaultFilterOptions, ...genreFilterOptions]
    : defaultFilterOptions;

  const handleFilterPress = (filterId: string) => {
    setActiveFilter(filterId);
    onFilterChange?.(filterId);
  };

  if (showGenres) {
    // Para pantallas con géneros, usar ScrollView horizontal
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              filter.isGenre && { 
                backgroundColor: activeFilter === filter.id ? getGenreColor(filter.id) : '#333',
                borderColor: getGenreColor(filter.id),
                borderWidth: activeFilter === filter.id ? 0 : 1,
              },
              activeFilter === filter.id && !filter.isGenre && styles.activeFilter
            ]}
            onPress={() => handleFilterPress(filter.id)}
            activeOpacity={0.7}
          >
            {filter.icon && (
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color="white" 
              />
            )}
            <Text style={[
              styles.filterButtonText,
              filter.icon && styles.filterButtonTextWithIcon
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // Para pantallas básicas (Inicio), usar diseño original
  return (
    <View style={styles.filtersContainerRow}>
      {filterOptions.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            activeFilter === filter.id && styles.activeFilter
          ]}
          onPress={() => handleFilterPress(filter.id)}
          activeOpacity={0.7}
        >
          {filter.icon && (
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color="white" 
            />
          )}
          <Text style={[
            styles.filterButtonText,
            filter.icon && styles.filterButtonTextWithIcon
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContainerRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#8A2BE2', // Color púrpura similar al original
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterButtonTextWithIcon: {
    marginLeft: 8,
  },
});

export default FilterButtons;