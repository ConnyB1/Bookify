import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Dimensions, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl } from '../../../config/api';
import { useAuth } from '@/contexts/AuthContext';

interface ImagenDTO { url_imagen: string; }
interface GeneroDTO { nombre: string; }
interface PropietarioDTO {
  id_usuario: number;
  nombre_usuario: string;
}
interface LibroDTO {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  estado: string;
  propietario: PropietarioDTO;
  generos?: GeneroDTO[];
  imagenes?: ImagenDTO[];
}

const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [libro, setLibro] = useState<LibroDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);

  const bookId = typeof id === 'string' ? parseInt(id, 10) : undefined;

  useEffect(() => {
    if (bookId) {
      fetchBookDetails(bookId);
    } else {
      setLoading(false);
    }
  }, [bookId]);

  const fetchBookDetails = async (id: number) => {
    setLoading(true);
    try {
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BOOKS}/${id}`);
      const response = await fetch(url);

      if (response.status === 400) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Libro no encontrado.');
      }

      if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);

      const result = await response.json();
      if (result && result.id_libro) setLibro(result);
      else throw new Error('Respuesta inválida o libro no encontrado.');
    } catch (error) {
      console.error('Error fetching book details:', error);
      Alert.alert('Error', `No se pudo cargar el detalle del libro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeRequest = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para solicitar un intercambio');
      return;
    }
    if (!libro) return;

    if (libro.propietario.id_usuario === user.id_usuario) {
      Alert.alert('Error', 'No puedes solicitar intercambio de tu propio libro');
      return;
    }

    Alert.alert(
      'Solicitar Intercambio',
      `¿Deseas solicitar intercambio del libro "${libro.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar Solicitud',
          onPress: async () => {
            setSendingRequest(true);
            try {
              const response = await fetch(buildApiUrl('/api/exchange/request'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_libro_solicitado: libro.id_libro,
                  id_usuario_solicitante: user.id_usuario,
                  id_usuario_receptor: libro.propietario.id_usuario,
                }),
              });

              const result = await response.json();
              if (result.success) {
                Alert.alert(
                  'Éxito',
                  'Solicitud de intercambio enviada correctamente.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else throw new Error(result.message || 'Error al enviar solicitud');
            } catch (error) {
              console.error('Error sending exchange request:', error);
              Alert.alert('Error', `No se pudo enviar la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            } finally {
              setSendingRequest(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#d500ff" />
        <ThemedText>Cargando detalles...</ThemedText>
      </ThemedView>
    );
  }

  if (!libro) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>No se encontró la información del libro.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: "Información del Libro",
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 10, marginRight: 25 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Imagen del libro */}
          {libro.imagenes && libro.imagenes.length > 0 && (
            <Image source={{ uri: libro.imagenes[0].url_imagen }} style={styles.bookImage} />
          )}

          {/* Información principal */}
          <ThemedText style={styles.title}>{libro.titulo}</ThemedText>
          <ThemedText style={styles.owner}>{libro.propietario?.nombre_usuario || 'Propietario desconocido'}</ThemedText>

          {/* Botón sólido */}
          <TouchableOpacity
            onPress={handleExchangeRequest}
            disabled={sendingRequest || libro.propietario.id_usuario === user?.id_usuario}
            style={[
              styles.exchangeButton,
              (sendingRequest || libro.propietario.id_usuario === user?.id_usuario) && styles.exchangeButtonDisabled
            ]}
          >
            {sendingRequest ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.exchangeButtonText}>
                {libro.propietario.id_usuario === user?.id_usuario ? 'Tu libro' : 'Intercambiar'}
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* Descripción */}
          <View style={styles.descriptionContainer}>
            <ThemedText style={styles.sectionTitle}>Descripción</ThemedText>
            <ThemedText style={styles.descriptionText}>
              {libro.descripcion || 'Este libro no tiene una descripción detallada.'}
            </ThemedText>
          </View>

          {/* Datos del libro */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="book-open-page-variant" size={26} color="#d500ff" />
              <ThemedText style={styles.infoLabel}>Género</ThemedText>
              <ThemedText style={styles.infoText}>{libro.generos?.map(g => g.nombre).join(', ') || 'Ficción'}</ThemedText>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar" size={26} color="#d500ff" />
              <ThemedText style={styles.infoLabel}>Publicado</ThemedText>
              <ThemedText style={styles.infoText}>1883</ThemedText>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="translate" size={26} color="#d500ff" />
              <ThemedText style={styles.infoLabel}>Idioma</ThemedText>
              <ThemedText style={styles.infoText}>Español</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 100, // Espacio para la barra de navegación
  },
  card: {
    backgroundColor: '#151718',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
    shadowColor: '#d500ff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bookImage: {
    width: width * 0.6,
    height: width * 0.85,
    borderRadius: 12,
    marginBottom: 15,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  owner: {
    color: 'lightgray',
    fontSize: 16,
    marginVertical: 6,
  },
  exchangeButton: {
    marginTop: 10,
    backgroundColor: '#d500ff',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  exchangeButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  exchangeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    width: '100%',
    marginTop: 25,
  },
  sectionTitle: {
    color: '#d500ff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  descriptionText: {
    color: 'lightgray',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'justify',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    width: '100%',
  },
  infoItem: {
    alignItems: 'center',
    width: '30%',
  },
  infoLabel: {
    color: '#d500ff',
    fontSize: 14,
    marginTop: 5,
  },
  infoText: {
    color: 'lightgray',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});
