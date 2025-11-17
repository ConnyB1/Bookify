import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconColor?: string;
}

/**
 * Componente reutilizable para estados vacíos
 * 
 * Ejemplo de uso:
 * ```tsx
 * {books.length === 0 && (
 *   <EmptyState
 *     icon="book-outline"
 *     title="No hay libros disponibles"
 *     subtitle="Desliza hacia abajo para actualizar"
 *   />
 * )}
 * ```
 */
export function EmptyState({ 
  icon = 'information-circle-outline',
  title, 
  subtitle,
  iconSize = 80,
  iconColor = '#666'
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
