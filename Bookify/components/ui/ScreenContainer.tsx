import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { ThemedView } from '../themed-view';

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/**
 * Componente reutilizable para containers de pantalla
 * 
 * Ejemplo de uso:
 * ```tsx
 * export default function MiPantalla() {
 *   return (
 *     <ScreenContainer>
 *       <Header />
 *       <Content />
 *     </ScreenContainer>
 *   );
 * }
 * ```
 */
export function ScreenContainer({ 
  children, 
  edges = ['top', 'bottom'],
  style,
  contentStyle 
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <ThemedView style={[styles.container, contentStyle]}>
        {children}
      </ThemedView>
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});
