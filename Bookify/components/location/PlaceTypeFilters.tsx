import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {SAFE_MEETING_PLACE_TYPES.map((item) => (
          selectedType === item.type ? (
            <LinearGradient
              key={item.type}
              colors={['#6100BD', '#D500FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <TouchableOpacity
                style={styles.btnContent}
                onPress={() => onSelectType(item.type)}
                disabled={disabled}
              >
                <Ionicons name={item.icon as any} size={20} color="#fff" />
                <Text style={styles.textActive}>{item.label}</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              key={item.type}
              style={styles.btn}
              onPress={() => onSelectType(item.type)}
              disabled={disabled}
            >
              <Ionicons name={item.icon as any} size={20} color="#666" />
              <Text style={styles.text}>{item.label}</Text>
            </TouchableOpacity>
          )
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
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
    overflow: 'hidden',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#666' },
  textActive: { marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#fff' },
});
