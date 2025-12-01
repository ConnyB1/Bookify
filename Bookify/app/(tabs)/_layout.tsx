import { Ionicons } from '@expo/vector-icons';
import { Tabs, Redirect } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d500ff" />
      </View>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Redirect href="/Auth/Login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#9d34ffff', 
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#1A1D1F', // Fondo oscuro
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          borderRadius: 15,
          paddingTop: 10,
          
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      
      {/* Nota: la ruta dinámica `libro/[id]` debe registrarse fuera de las pestañas
          (por ejemplo en app/_layout o una pila aparte). Mantener la barra de pestañas
          limpia evita el warning sobre rutas anidadas. */}
      
      <Tabs.Screen
        name="Inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="Buscar"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="agregar"
        options={{
          title: 'Agregar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name="add-circle" 
              size={focused ? 28 : 24} 
              color={focused ? '#9d34ffff' : color}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="ubicacion"
        options={{
          href: null, // Oculta de la barra de tabs
          title: 'Ubicación',
        }}
      />
      
      <Tabs.Screen
        name="libro/[id]"
        options={{
          href: null, // Oculta de la barra de tabs
          title: 'Detalle del Libro',
        }}
      />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});