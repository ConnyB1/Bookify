import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getGenreColor, getGenreColorLight } from '../../utils/genreColors';

interface GenreChipProps {
  genre: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'light';
}

const GenreChip: React.FC<GenreChipProps> = ({ 
  genre, 
  size = 'medium',
  variant = 'filled'
}) => {
  const genreColor = getGenreColor(genre);
  
  const getChipStyle = () => {
    const baseStyle = [styles.chip, styles[size]];
    
    switch (variant) {
      case 'filled':
        return [...baseStyle, { backgroundColor: genreColor }];
      case 'outlined':
        return [...baseStyle, { 
          backgroundColor: 'transparent', 
          borderColor: genreColor, 
          borderWidth: 1 
        }];
      case 'light':
        return [...baseStyle, { backgroundColor: getGenreColorLight(genre) }];
      default:
        return [...baseStyle, { backgroundColor: genreColor }];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'filled':
        return [...baseStyle, { color: 'white' }];
      case 'outlined':
      case 'light':
        return [...baseStyle, { color: genreColor }];
      default:
        return [...baseStyle, { color: 'white' }];
    }
  };

  return (
    <View style={getChipStyle()}>
      <Text style={getTextStyle()}>{genre}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});

export default GenreChip;