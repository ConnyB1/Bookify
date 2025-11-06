import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces necesarias para el DTO (deberían estar en config/api.ts)
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
      
      // 🛑 FIX CRÍTICO: Manejar errores del backend y respuesta sin envelope 🛑
      if (response.status === 400) {
        // Manejar el BadRequestException (Libro no encontrado)
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Libro no encontrado.'); 
      }
      
      if (!response.ok) {
        throw new Error(`Error de red: ${response.statusText}`);
      }
      
      // El resultado es directamente el objeto del libro
      const result = await response.json(); 
      
      // Verificar si el resultado es un objeto Libro válido
      if (result && result.id_libro) {
        setLibro(result);
      } else {
        throw new Error('Respuesta del servidor inválida o libro no encontrado.');
      }
      
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

    // Verificar que no sea el propietario
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
                headers: {
                  'Content-Type': 'application/json',
                },
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
                  'Solicitud de intercambio enviada correctamente. El propietario recibirá una notificación.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                throw new Error(result.message || 'Error al enviar solicitud');
              }
            } catch (error) {
              console.error('Error sending exchange request:', error);
              Alert.alert(
                'Error',
                `No se pudo enviar la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`
              );
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
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          
          {/* Imágenes del Libro */}
          {libro.imagenes && libro.imagenes.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {libro.imagenes.map((img, index) => (
                <Image 
                  key={index}
                  source={{ uri: img.url_imagen }} // Usar url_imagen como viene del backend
                  style={styles.bookImage}
                />
              ))}
            </ScrollView>
          )}

          <ThemedText style={styles.title}>{libro.titulo}</ThemedText>
          
          <ThemedText style={styles.label}>Autor:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.autor}</ThemedText>
          
          <ThemedText style={styles.label}>Propietario:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.propietario?.nombre_usuario || 'Anónimo'}</ThemedText>

          <ThemedText style={styles.label}>Estado:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.estado.replace('_', ' ').toUpperCase()}</ThemedText>

          <ThemedText style={styles.label}>Descripción:</ThemedText>
          <ThemedText style={styles.descriptionText}>
            {libro.descripcion || 'Este libro no tiene una descripción detallada.'}
          </ThemedText>
          
          <ThemedText style={styles.label}>Géneros:</ThemedText>
          <ThemedText style={styles.detailText}>
            {libro.generos?.map(g => g.nombre).join(', ') || 'Sin géneros asignados.'}
          </ThemedText>

          {/* Botón de Intercambio */}
          <TouchableOpacity
            style={[
              styles.exchangeButton,
              (sendingRequest || libro.propietario.id_usuario === user?.id_usuario) && styles.exchangeButtonDisabled
            ]}
            onPress={handleExchangeRequest}
            disabled={sendingRequest || libro.propietario.id_usuario === user?.id_usuario}
          >
            {sendingRequest ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.exchangeButtonText}>
                {libro.propietario.id_usuario === user?.id_usuario
                  ? 'Tu libro'
                  : 'Solicitar Intercambio'}
              </ThemedText>
            )}
          </TouchableOpacity>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#151718' 
  },
  exchangeButton: {
    marginTop: 30,
    backgroundColor: '#d500ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  container: { 
    padding: 20 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#151718'
  },
  errorText: { 
    color: 'red', 
    marginTop: 10 
  },
  scrollContent: { 
    paddingBottom: 50 
  },
  imagesContainer: { 
    marginBottom: 20, 
    paddingRight: 10,
  },
  bookImage: { 
    width: width * 0.8,
    height: width * 1.1, 
    marginRight: 10, 
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#2a2a2a',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: 'white' 
  },
  label: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 15, 
    marginBottom: 5,
    color: '#d500ff' 
  },
  detailText: { 
    fontSize: 16, 
    color: 'lightgray' 
  },
  descriptionText: { 
    fontSize: 16, 
    marginTop: 5, 
    color: 'lightgray', 
    lineHeight: 22 
  },
});