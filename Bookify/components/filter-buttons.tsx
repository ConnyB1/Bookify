import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGenreColor } from '../utils/genreColors';

type FilterOption = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isGenre?: boolean;
};

const defaultFilterOptions: FilterOption[] = [
  { id: 'all', label: 'Todos los títulos', icon: 'apps' },
  { id: 'for-you', label: 'Para ti', icon: 'heart' },
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
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id;
          const isGenre = filter.isGenre;
          
          if (isActive && !isGenre) {
            return (
              <LinearGradient
                key={filter.id}
                colors={['#6100BD', '#D500FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.filterButton, { backgroundColor: 'transparent' }]}
              >
                <TouchableOpacity
                  style={styles.filterButtonContent}
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
              </LinearGradient>
            );
          }
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                isGenre && { 
                  backgroundColor: isActive ? getGenreColor(filter.id) : '#333',
                  borderColor: getGenreColor(filter.id),
                  borderWidth: isActive ? 0 : 1,
                }
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
          );
        })}
      </ScrollView>
    );
  }

  // Para pantallas básicas (Inicio), usar diseño original
  return (
    <View style={styles.filtersContainerRow}>
      {filterOptions.map((filter) => {
        const isActive = activeFilter === filter.id;
        
        if (isActive) {
          return (
            <LinearGradient
              key={filter.id}
              colors={['#6100BD', '#D500FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.filterButton, { backgroundColor: 'transparent' }]}
            >
              <TouchableOpacity
                style={styles.filterButtonContent}
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
            </LinearGradient>
          );
        }
        
        return (
          <TouchableOpacity
            key={filter.id}
            style={styles.filterButton}
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
        );
      })}
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
    overflow: 'hidden',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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