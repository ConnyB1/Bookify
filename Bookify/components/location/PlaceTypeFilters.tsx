import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SAFE_MEETING_PLACE_TYPES } from '../../services/openStreetMap';

interface PlaceTypeFiltersProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  disabled?: boolean;
}

export function PlaceTypeFilters({ selectedType, onSelectType, disabled }: PlaceTypeFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {SAFE_MEETING_PLACE_TYPES.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[styles.btn, selectedType === item.type && styles.btnActive]}
            onPress={() => onSelectType(item.type)}
            disabled={disabled}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={selectedType === item.type ? '#fff' : '#666'}
            />
            <Text style={[styles.text, selectedType === item.type && styles.textActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnActive: { backgroundColor: '#d500ff' },
  text: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#666' },
  textActive: { color: '#fff' },
});
