import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/config/api';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router, Stack } from 'expo-router';

interface UserLocation {
  latitud: number | null;
  longitud: number | null;
  radio_busqueda_km: number;
  ciudad: string | null;
  ubicacion_actualizada_at: Date | null;
}

export default function LocationSettingsScreen() {
  const { user, syncUserFromBackend } = useAuth();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(10);

  const radiusOptions = [5, 10, 20, 50];

  useEffect(() => {
    loadUserLocation();
  }, []);

  const loadUserLocation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(`/api/auth/location/${user.id_usuario}`)
      );
      const result = await response.json();

      if (result.success) {
        setLocation(result.data);
        setSelectedRadius(result.data.radio_busqueda_km);
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos Denegados',
        'Necesitamos acceso a tu ubicación para mostrarte libros cercanos. Tu ubicación exacta nunca se comparte con otros usuarios.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    setUpdating(true);
    try {
      // 1. Solicitar permisos
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setUpdating(false);
        return;
      }

      // 2. Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 3. Geocoding reverso para obtener ciudad
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const ciudad = address.city || address.subregion || address.region || 'Ubicación desconocida';

      // 4. Guardar en backend
      await saveLocation(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        ciudad
      );

      Alert.alert(
        'Ubicación Actualizada',
        `Tu ubicación se ha configurado en ${ciudad}. Los libros ahora se mostrarán según tu radio de búsqueda.`
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
    } finally {
      setUpdating(false);
    }
  };

  const saveLocation = async (lat: number, lng: number, ciudad: string) => {
    if (!user) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/auth/location/${user.id_usuario}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitud: lat,
            longitud: lng,
            ciudad: ciudad,
            radio_busqueda_km: selectedRadius,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setLocation(result.data);
        // ✅ FIX: Sincronizar el contexto de Auth con los datos actualizados del backend
        await syncUserFromBackend();
      }
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  };

  const updateSearchRadius = async (radius: number) => {
    if (!user) return;

    try {
      setSelectedRadius(radius);

      const response = await fetch(
        buildApiUrl(`/api/auth/search-radius/${user.id_usuario}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ radio_busqueda_km: radius }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('Radio Actualizado', `Ahora verás libros dentro de ${radius} km`);
        loadUserLocation();
        // ✅ FIX: Sincronizar el contexto de Auth con los datos actualizados del backend
        await syncUserFromBackend();
      }
    } catch (error) {
      console.error('Error updating radius:', error);
      Alert.alert('Error', 'No se pudo actualizar el radio de búsqueda');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d500ff" />
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Configuración de Ubicación",
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/perfil')}
              style={{ marginLeft: 10, marginRight: 25 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="location" size={40} color="#d500ff" />
            <ThemedText style={styles.headerTitle}>Configuración de Ubicación</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Tu ubicación exacta nunca se comparte con otros usuarios
            </ThemedText>
          </View>

          {/* Estado Actual */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Ubicación Actual</ThemedText>
            <View style={styles.card}>
              {location?.latitud && location?.longitud ? (
                <>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#d500ff" />
                    <ThemedText style={styles.infoText}>
                      {location.ciudad || 'Ubicación configurada'}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#888" />
                    <Text style={styles.infoTextSecondary}>
                      Actualizada: {formatDate(location.ubicacion_actualizada_at?.toString() || null)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.infoRow}>
                  <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
                  <ThemedText style={styles.infoText}>
                    No has configurado tu ubicación
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Botón para obtener ubicación */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.locationButton, updating && styles.locationButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={updating}
            >
              {updating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.locationButtonText}>Obteniendo ubicación...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={24} color="#fff" />
                  <Text style={styles.locationButtonText}>Usar Mi Ubicación Actual</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Selector de Radio */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Radio de Búsqueda</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Elige qué tan lejos quieres buscar libros
            </ThemedText>
            <View style={styles.radiusGrid}>
              {radiusOptions.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    selectedRadius === radius && styles.radiusOptionActive,
                  ]}
                  onPress={() => updateSearchRadius(radius)}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      selectedRadius === radius && styles.radiusTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Información de Privacidad */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Privacidad</ThemedText>
            <View style={styles.privacyCard}>
              <View style={styles.privacyItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4caf50" />
                <Text style={styles.privacyText}>
                  Tu ubicación exacta nunca se comparte
                </Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="eye-off" size={20} color="#4caf50" />
                <Text style={styles.privacyText}>
                  Otros usuarios solo ven la distancia aproximada
                </Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="people" size={20} color="#4caf50" />
                <Text style={styles.privacyText}>
                  El punto de encuentro se acuerda después del intercambio
                </Text>
              </View>
            </View>
          </View>
        </ThemedView>
        <View style={styles.parellenar}>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  parellenar: {
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  infoTextSecondary: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
    flex: 1,
  },
  locationButton: {
    backgroundColor: '#d500ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radiusOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  radiusOptionActive: {
    backgroundColor: '#2a1a3a',
    borderColor: '#d500ff',
  },
  radiusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  radiusTextActive: {
    color: '#d500ff',
  },
  privacyCard: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
