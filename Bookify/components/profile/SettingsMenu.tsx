import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsMenuProps {
  visible: boolean;
  onGenrePreferencesPress: () => void;
  onLogoutPress: () => void;
}

export default function SettingsMenu({ 
  visible, 
  onGenrePreferencesPress, 
  onLogoutPress 
}: SettingsMenuProps) {
  if (!visible) return null;

  return (
    <View style={styles.settingsMenu}>
      <TouchableOpacity
        style={styles.settingsMenuItem}
        onPress={onGenrePreferencesPress}
        activeOpacity={0.7}
      >
        <Ionicons name="heart-outline" size={22} color="#d500ff" />
        <Text style={styles.settingsMenuText}>Preferencias de Géneros</Text>
      </TouchableOpacity>
      
      <View style={styles.settingsMenuDivider} />
      
      <TouchableOpacity
        style={styles.settingsMenuItem}
        onPress={onLogoutPress}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={22} color="#ff4444" />
        <Text style={[styles.settingsMenuText, { color: '#ff4444' }]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 240,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingsMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  settingsMenuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 12,
  },
});
