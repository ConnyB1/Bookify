import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { API_CONFIG, buildApiUrl } from '../../../config/api';
import { useAuth } from '@/contexts/AuthContext';
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';

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

interface UserBooksCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  // 2. Obtener 'tokens' para la autenticación
  const { user, tokens } = useAuth(); 

  // 3. Instanciar el hook de alerta
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  const [libro, setLibro] = useState<LibroDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userBooksCount, setUserBooksCount] = useState<number>(0);
  const [hasPendingExchange, setHasPendingExchange] = useState(false);

  const bookId = typeof id === 'string' ? parseInt(id, 10) : undefined;

  useEffect(() => {
    if (bookId) {
      fetchBookDetails(bookId);
      setCurrentImageIndex(0); // Resetear al cambiar de libro
    } else {
      setLoading(false);
    }
    
    // Cargar cantidad de libros del usuario
    if (user?.id_usuario) {
      fetchUserBooksCount(user.id_usuario);
    }
    
    // Verificar si ya existe una solicitud pendiente
    if (bookId && user?.id_usuario && libro?.propietario?.id_usuario) {
      checkPendingExchange(bookId, user.id_usuario, libro.propietario.id_usuario);
    }
  }, [bookId, user?.id_usuario, libro?.propietario?.id_usuario]);

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
      // CORRECCIÓN DE BUG: Tu API devuelve el objeto directo
      if (result && result.id_libro) setLibro(result);
      else throw new Error('Respuesta inválida o libro no encontrado.');
    } catch (error) {
      console.error('Error fetching book details:', error);
      // 4. Reemplazar Alert.alert con showAlert
      showAlert(
        'Error',
        `No se pudo cargar el detalle del libro: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'OK', onPress: () => {
          hideAlert();
          router.back();
        }}]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBooksCount = async (userId: number) => {
    try {
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BOOKS}/user/${userId}/count`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const result: UserBooksCountResponse = await response.json();
        if (result.success && result.data) {
          setUserBooksCount(result.data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching user books count:', error);
      setUserBooksCount(0);
    }
  };

  const checkPendingExchange = async (bookId: number, userId: number, ownerId: number) => {
    try {
      const url = buildApiUrl(`/api/exchange/check-pending?bookId=${bookId}&userId=${userId}&ownerId=${ownerId}`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setHasPendingExchange(result.hasPending || false);
      }
    } catch (error) {
      console.error('Error checking pending exchange:', error);
      setHasPendingExchange(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!user || !tokens || !tokens.accessToken || !libro) return;

    showAlert(
      'Eliminar Libro',
      `¿Estás seguro de que deseas eliminar "${libro.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            setLoading(true);
            try {
              const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BOOKS}/${libro.id_libro}`);
              console.log('[DELETE] URL:', url);
              console.log('[DELETE] Book ID:', libro.id_libro);
              console.log('[DELETE] Token:', tokens.accessToken ? 'Present' : 'Missing');
              
              const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${tokens.accessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              console.log('[DELETE] Response status:', response.status);
              console.log('[DELETE] Response ok:', response.ok);

              // Intentar leer la respuesta
              let errorData;
              try {
                const responseText = await response.text();
                console.log('[DELETE] Response text:', responseText);
                errorData = responseText ? JSON.parse(responseText) : {};
              } catch (parseError) {
                console.error('[DELETE] Error parsing response:', parseError);
                errorData = { message: 'Error al procesar la respuesta del servidor' };
              }

              if (response.ok) {
                showAlert(
                  'Éxito',
                  'El libro ha sido eliminado correctamente.',
                  [{
                    text: 'OK',
                    onPress: () => {
                      hideAlert();
                      router.back();
                    }
                  }]
                );
              } else {
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
              }
            } catch (error) {
              console.error('[DELETE] Error deleting book:', error);
              showAlert(
                'Error',
                `No se pudo eliminar el libro: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                [{ text: 'OK', onPress: hideAlert }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExchangeRequest = async () => {
    // 4. Reemplazar Alert.alert y añadir chequeo de tokens
    if (!user || !tokens || !tokens.accessToken) {
      showAlert('Error', 'Debes iniciar sesión para solicitar un intercambio', [
        { text: 'OK', onPress: hideAlert }
      ]);
      return;
    }
    if (!libro) return;

    if (libro.propietario.id_usuario === user.id_usuario) {
      showAlert('Error', 'No puedes solicitar intercambio de tu propio libro', [
        { text: 'OK', onPress: hideAlert }
      ]);
      return;
    }

    // Verificar si ya existe una solicitud pendiente
    if (hasPendingExchange) {
      showAlert(
        'Solicitud Pendiente',
        'Ya tienes una solicitud de intercambio pendiente para este libro. Espera a que el propietario responda.',
        [{ text: 'Entendido', onPress: hideAlert }]
      );
      return;
    }

    if (userBooksCount === 0) {
      showAlert(
        'Libro Requerido',
        'Debes publicar al menos un libro antes de poder solicitar intercambios. Esto asegura un intercambio justo para ambas partes.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
          { 
            text: 'Publicar Libro', 
            onPress: () => {
              hideAlert();
              router.push('/(tabs)/agregar');
            }
          }
        ]
      );
      return;
    }

    // 4. Reemplazar Alert.alert
    showAlert(
      'Confirmar Solicitud', // Título cambiado para mejor icono
      `¿Deseas solicitar intercambio del libro "${libro.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
        {
          text: 'Enviar Solicitud',
          onPress: async () => {
            hideAlert(); // Ocultar esta alerta
            setSendingRequest(true);
            try {
              // BUG FIX: Usar el endpoint correcto de la config
              const url = buildApiUrl(API_CONFIG.ENDPOINTS.EXCHANGE_REQUEST);
              
              const response = await fetch(url, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id_libro_solicitado: libro.id_libro,
                  id_usuario_solicitante: user.id_usuario,
                  // El backend obtiene el receptor automáticamente del propietario del libro
                }),
              });

              const result = await response.json();
              
              // BUG FIX: Usar response.ok es más seguro que result.success
              if (response.ok) {
                // Actualizar estado para indicar que hay solicitud pendiente
                setHasPendingExchange(true);
                
                // 4. Reemplazar Alert.alert
                showAlert(
                  'Éxito',
                  'Solicitud de intercambio enviada correctamente.',
                  [{ text: 'Genial', onPress: () => {
                    hideAlert();
                    router.back();
                  }}]
                );
              } else {
                throw new Error(result.message || 'Error al enviar solicitud');
              }
            } catch (error) {
              console.error('Error sending exchange request:', error);
              // 4. Reemplazar Alert.alert
              showAlert(
                'Error',
                `No se pudo enviar la solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                [{ text: 'OK', onPress: hideAlert }]
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
  
  // BUG FIX: Chequear si 'user' existe antes de comparar IDs
  const isOwner = user ? libro.propietario.id_usuario === user.id_usuario : false;

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
          {/* Carrusel de imágenes del libro */}
          {libro.imagenes && libro.imagenes.length > 0 ? (
            <View style={styles.carouselContainer}>
              {/* Imagen principal */}
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: libro.imagenes[currentImageIndex].url_imagen }} 
                  style={styles.bookImage} 
                  resizeMode="cover"
                />
                
                {/* Indicador de cantidad de imágenes */}
                {libro.imagenes.length > 1 && (
                  <View style={styles.imageCounter}>
                    <Ionicons name="images" size={16} color="#fff" />
                    <ThemedText style={styles.imageCounterText}>
                      {currentImageIndex + 1} / {libro.imagenes.length}
                    </ThemedText>
                  </View>
                )}

                {/* Botones de navegación si hay más de una imagen */}
                {libro.imagenes.length > 1 && (
                  <>
                    {/* Botón anterior */}
                    {currentImageIndex > 0 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.navButtonLeft]}
                        onPress={() => setCurrentImageIndex(prev => prev - 1)}
                      >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}

                    {/* Botón siguiente */}
                    {currentImageIndex < libro.imagenes.length - 1 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.navButtonRight]}
                        onPress={() => setCurrentImageIndex(prev => prev + 1)}
                      >
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              {/* Miniaturas */}
              {libro.imagenes.length > 1 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailsContainer}
                  contentContainerStyle={styles.thumbnailsContent}
                >
                  {libro.imagenes.map((imagen, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      style={[
                        styles.thumbnail,
                        currentImageIndex === index && styles.thumbnailActive
                      ]}
                    >
                      <Image 
                        source={{ uri: imagen.url_imagen }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={60} color="#666" />
              <ThemedText style={styles.noImageText}>Sin imágenes</ThemedText>
            </View>
          )}

          {/* Información principal */}
          <ThemedText style={styles.title}>{libro.titulo}</ThemedText>
          <ThemedText style={styles.owner}>{libro.propietario?.nombre_usuario || 'Propietario desconocido'}</ThemedText>

          {/* Botón de intercambio (solo si no es el dueño) */}
          {!isOwner && (
            <>
              {hasPendingExchange ? (
                <View style={styles.pendingExchangeContainer}>
                  <View style={styles.pendingExchangeButton}>
                    <Ionicons name="time-outline" size={20} color="#FFA726" />
                    <ThemedText style={styles.pendingExchangeText}>
                      Solicitud Pendiente
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.pendingExchangeSubtext}>
                    Ya enviaste una solicitud de intercambio. Espera la respuesta del propietario.
                  </ThemedText>
                </View>
              ) : sendingRequest ? (
                <TouchableOpacity
                  disabled={true}
                  style={[styles.exchangeButton, styles.exchangeButtonDisabled]}
                >
                  <ActivityIndicator color="white" />
                </TouchableOpacity>
              ) : (
                <LinearGradient
                  colors={['#6100BD', '#D500FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.exchangeButton}
                >
                  <TouchableOpacity
                    onPress={handleExchangeRequest}
                    style={styles.exchangeButtonContent}
                  >
                    <ThemedText style={styles.exchangeButtonText}>
                      Intercambiar
                    </ThemedText>
                  </TouchableOpacity>
                </LinearGradient>
              )}
            </>
          )}

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

          {/* Botón de eliminar (solo si es el dueño) */}
          {isOwner && (
            <TouchableOpacity
              onPress={handleDeleteBook}
              disabled={loading}
              style={[
                styles.deleteButton,
                loading && styles.deleteButtonDisabled
              ]}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <ThemedText style={styles.deleteButtonText}>
                Eliminar este libro
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 5. Añadir el componente CustomAlert al final */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
  // Estilos del carrusel
  carouselContainer: {
    width: '100%',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.85,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  bookImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 10,
  },
  navButtonRight: {
    right: 10,
  },
  thumbnailsContainer: {
    maxHeight: 80,
  },
  thumbnailsContent: {
    paddingHorizontal: 5,
    gap: 10,
  },
  thumbnail: {
    width: 60,
    height: 75,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#d500ff',
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: width * 0.85,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
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
    borderRadius: 30,
    width: '100%',
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  exchangeButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exchangeButtonContent: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  exchangeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingExchangeContainer: {
    marginTop: 10,
    width: '100%',
  },
  pendingExchangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 30,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  pendingExchangeText: {
    color: '#FFA726',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingExchangeSubtext: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 18,
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
  deleteButton: {
    marginTop: 30,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  deleteButtonDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
    opacity: 0.5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});