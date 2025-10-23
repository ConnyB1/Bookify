import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterOption = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All Titles', icon: 'apps' },
  { id: 'favorites', label: 'For You', icon: 'heart' },
];

interface FilterButtonsProps {
  onFilterChange?: (filterId: string) => void;
  initialFilter?: string;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  onFilterChange, 
  initialFilter = 'all' 
}) => {
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const handleFilterPress = (filterId: string) => {
    setActiveFilter(filterId);
    onFilterChange?.(filterId);
  };

  return (
    <View style={styles.filtersContainer}>
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
          <Ionicons 
            name={filter.icon} 
            size={16} 
            color="white" 
          />
          <Text style={styles.filterButtonText}>{filter.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default FilterButtons;