import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Componente reutilizable para pantallas de carga
 * 
 * Ejemplo de uso:
 * ```tsx
 * if (loading) {
 *   return <LoadingScreen message="Cargando libros..." />;
 * }
 * ```
 */
export function LoadingScreen({ 
  message = 'Cargando...', 
  size = 'large',
  color = '#d500ff' 
}: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.text}>{message}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  text: {
    color: '#999',
    marginTop: 12,
    fontSize: 16,
  },
});
