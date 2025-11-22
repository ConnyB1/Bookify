import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useNotificaciones } from '@/hooks/notificaciones';

// Componente interno que tiene acceso al AuthContext
function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // 🔔 Activar notificaciones push automáticamente cuando el usuario esté autenticado
  useNotificaciones(isAuthenticated);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Ocultar completamente la barra de navegación (modo inmersivo)
      NavigationBar.setVisibilityAsync('hidden');
      // Opcional: hacer que la barra sea del mismo color que tu app cuando aparezca
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <ThemeProvider value={DarkTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen 
            name="Auth/Login" 
            options={{ 
              headerShown: false,
              presentation: 'card',
            }} 
          />
          <Stack.Screen 
            name="Auth/Register" 
            options={{ 
              headerShown: false,
              presentation: 'card',
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
    backgroundColor: '#000000',
  },
});