import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface LocationRequiredScreenProps {
  children: React.ReactNode;
}

/**
 * Componente que bloquea el acceso a ciertas pantallas si el usuario no ha configurado su ubicación.
 * Muestra una pantalla bloqueada con un mensaje para ir a configurar la ubicación en el perfil.
 * 
 * ✅ La sincronización se hace automáticamente en AuthContext al iniciar la app,
 *    por lo que este componente solo verifica el estado actual del usuario.
 */
export default function LocationRequiredScreen({ children }: LocationRequiredScreenProps) {
  const { user } = useAuth();
  const router = useRouter();

  // ✅ Verificar si el usuario tiene ubicación configurada
  const hasLocation = 
    user?.latitud !== undefined && 
    user?.latitud !== null && 
    user?.longitud !== undefined && 
    user?.longitud !== null &&
    !isNaN(Number(user.latitud)) &&
    !isNaN(Number(user.longitud));

  // Si tiene ubicación, mostrar el contenido normalmente
  if (hasLocation) {
    return <>{children}</>;
  }

  // Si NO tiene ubicación, mostrar pantalla bloqueada
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Ícono de ubicación */}
        <View style={styles.iconContainer}>
          <Ionicons name="location-outline" size={100} color="#d500ff" />
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={24} color="#fff" />
          </View>
        </View>

        {/* Título */}
        <ThemedText style={styles.title}>
          Ubicación requerida
        </ThemedText>

        {/* Mensaje */}
        <ThemedText style={styles.message}>
          Para ver, buscar y agregar libros, primero necesitas configurar tu ubicación.
        </ThemedText>
        
        <ThemedText style={styles.submessage}>
          Esto nos permite mostrarte libros cercanos y conectarte con personas de tu zona.
        </ThemedText>

        {/* Botón para ir al perfil */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(tabs)/ubicacion')}
        >
          <Ionicons name="navigate-circle-outline" size={24} color="#fff" />
          <ThemedText style={styles.buttonText}>
            Configurar mi ubicación
          </ThemedText>
        </TouchableOpacity>

        {/* Info adicional */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#888" />
          <ThemedText style={styles.infoText}>
            Ve a tu perfil para actualizar tu ubicación
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#d500ff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#151718',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  submessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d500ff',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: '#1f1f1f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
  },
});
