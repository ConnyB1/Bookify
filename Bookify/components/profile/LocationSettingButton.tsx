import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface LocationSettingButtonProps {
  onPress: () => void;
}

export default function LocationSettingButton({ onPress }: LocationSettingButtonProps) {
  return (
    <View style={styles.settingsSection}>
      <TouchableOpacity style={styles.settingButton} onPress={onPress}>
        <View style={styles.settingIcon}>
          <Ionicons name="location" size={24} color="#d500ff" />
        </View>
        <View style={styles.settingContent}>
          <ThemedText style={styles.settingTitle}>Configurar Ubicación</ThemedText>
          <Text style={styles.settingDescription}>
            Establece tu ubicación y radio de búsqueda
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsSection: {
    marginVertical: 12,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 13,
  },
});
