import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList, 
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useNotifications } from '@/hooks/useNotifications';
import { useExchangeActions } from '@/hooks/useExchangeActions';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; 
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';
import ImagePickerSheet from '@/components/ImagePickerSheet';

interface ImagenDTO {
  url_imagen: string;
}
interface GeneroDTO {
  nombre: string;
}
interface LibroDTO {
  id_libro: number;
  titulo: string;
  imagenes?: ImagenDTO[];
}

export default function PerfilScreen() {
  const router = useRouter();
  const {
    user,
    logout,
    updateUser, 
    tokens,    
  } = useAuth();
  
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [libros, setLibros] = useState<LibroDTO[]>([]);
  const [loadingLibros, setLoadingLibros] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profilePictureUri, setProfilePictureUri] = useState<string>(
    user?.foto_perfil_url ||
      'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  );
  const [isUploading, setIsUploading] = useState(false);

  // Sincronizar el estado con el contexto de Auth
  useEffect(() => {
    if (user?.foto_perfil_url) {
      setProfilePictureUri(user.foto_perfil_url);
    } else {
      setProfilePictureUri(
        'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      );
    }
  }, [user?.foto_perfil_url]);

  const showAlertWithClose = useCallback((
    title: string, 
    message: string, 
    buttons: any[]
  ) => {
    const buttonsWithClose = buttons.map(button => ({
      ...button,
      onPress: button.onPress || hideAlert, 
    }));
    showAlert(title, message, buttonsWithClose);
  }, [showAlert, hideAlert]);

  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    deleteReadNotifications,
  } = useNotifications(user?.id_usuario, showAlertWithClose); 

  const { handleNotificationPress } = useExchangeActions({
    userId: user?.id_usuario,
    showAlert: showAlertWithClose, 
    hideAlert,
    markAsRead,
    loadNotifications,
    closeNotifications: () => setShowNotifications(false),
  });

  const fetchLibros = useCallback(async () => {
    if (!user?.id_usuario) {
      setLoadingLibros(false);
      return;
    }

    if (!refreshing) {
      setLoadingLibros(true);
    }

    try {
      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS)}/user/${
        user.id_usuario
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('No se pudieron cargar los libros');
      }

      const result = await response.json();

      if (result && Array.isArray(result)) {
        setLibros(result);
      } else {
        setLibros([]);
      }
    } catch (error) {
      console.error('Error al cargar libros del usuario:', error);
      showAlert('Error', 'No se pudieron cargar tus libros.', [
        { text: 'OK', onPress: hideAlert }
      ]);
    } finally {
      setLoadingLibros(false);
    }
  }, [user, refreshing, hideAlert, showAlert]);

  useEffect(() => {
    fetchLibros();
  }, [fetchLibros]);

  // Refrescar libros y notificaciones
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLibros(), loadNotifications()]);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, fetchLibros, loadNotifications]);

  const openNotifications = () => {
    setShowNotifications(true);
    loadNotifications();
  };

  const handleDeleteReadNotifications = () => {
    const readCount = notifications.filter(n => n.leida).length;
    
    if (readCount === 0) {
      showAlert('Info', 'No hay notificaciones leídas para eliminar', [
        { text: 'OK', onPress: hideAlert }
      ]);
      return;
    }

    // Cerrar el modal PRIMERO
    setShowNotifications(false);

    // Mostrar confirmación después de un pequeño delay
    setTimeout(() => {
      showAlert(
        'Eliminar Notificaciones Leídas',
        `¿Deseas eliminar ${readCount} notificación${readCount !== 1 ? 'es' : ''} leída${readCount !== 1 ? 's' : ''}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              hideAlert();
              // Reabrir el modal si cancela
              setShowNotifications(true);
            },
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              hideAlert();
              const result = await deleteReadNotifications();
              
              // Mostrar resultado
              setTimeout(() => {
                if (result.success) {
                  showAlert('Éxito', `${result.count} notificación${result.count !== 1 ? 'es' : ''} eliminada${result.count !== 1 ? 's' : ''}`, [
                    { text: 'OK', onPress: hideAlert }
                  ]);
                } else {
                  showAlert('Error', result.message || 'No se pudieron eliminar las notificaciones', [
                    { text: 'OK', onPress: hideAlert }
                  ]);
                }
              }, 100);
            },
          },
        ]
      );
    }, 100);
  };

  const handleLogout = () => {
    // ✅ Usar showAlert original con hideAlert explícito
    showAlert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            hideAlert(); // Ocultar alerta primero
            await logout();
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Navegar a detalles del libro
  const handleBookPress = (bookId: number) => {
    router.push(`/libro/${bookId}`);
  };

  const pickImage = () => {
    setImagePickerVisible(true);
  };

  const handleGallerySelect = async () => {
    console.log('[Profile] Gallery selected');
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permiso requerido',
          'Necesitamos permiso para acceder a tu galería de fotos.',
          [{ text: 'OK', onPress: hideAlert }]
        );
        return;
      }
    }
    selectImageFrom('gallery');
  };

  const handleCameraSelect = async () => {
    console.log('[Profile] Camera selected');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        'Permiso requerido',
        'Necesitamos permiso para acceder a tu cámara.',
        [{ text: 'OK', onPress: hideAlert }]
      );
      return;
    }
    selectImageFrom('camera');
  };

  const selectImageFrom = async (source: 'gallery' | 'camera') => {
    let result;
    try {
      console.log(`[Profile] Launching ${source}...`);
      if (source === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      console.log(`[Profile] Result:`, result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setProfilePictureUri(selectedUri); 
        await uploadAndSaveProfilePicture(selectedUri); 
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      showAlert('Error', 'No se pudo seleccionar la imagen.', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  const uploadAndSaveProfilePicture = async (uri: string) => {
    if (!user || !tokens || !tokens.accessToken) {
      showAlert(
        'Error',
        'No se pudo identificar al usuario para subir la foto.',
        [{ text: 'OK', onPress: hideAlert }]
      );
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: `profile-${user.id_usuario}-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    let newPhotoUrl = '';

    try {
      const uploadUrl = buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_PROFILE_IMAGE);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo a S3');
      }

      const result = await response.json();
      if (!result.success || !result.data || !result.data.imageUrl) {
        throw new Error(
          result.message || 'El servidor no devolvió una URL de imagen',
        );
      }
      newPhotoUrl = result.data.imageUrl; 
    } catch (error) {
      console.error('Error en Paso 1 (Subida a S3):', error);
      showAlert(
        'Error de Subida',
        `No se pudo subir la foto: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
        [{ text: 'OK', onPress: hideAlert }]
      );
      setProfilePictureUri(
        user?.foto_perfil_url ||
          'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      ); 
      setIsUploading(false);
      return;
    }

    try {
      const saveUrl = `${buildApiUrl(
        API_CONFIG.ENDPOINTS.UPDATE_PROFILE_PICTURE,
      )}/${user.id_usuario}`;

      const response = await fetch(saveUrl, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`, 
        },
        body: JSON.stringify({ photoUrl: newPhotoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al guardar la URL en el perfil',
        );
      }
      const result = await response.json();
      if (updateUser && result.success && result.data.user) {
        updateUser(result.data.user);
      }
      showAlert('Éxito', 'Foto de perfil actualizada correctamente.', [
        { text: 'Genial', onPress: hideAlert }
      ]);
    } catch (error) {
      console.error('Error en Paso 2 (Guardar URL):', error);
      showAlert(
        'Error al Guardar',
        `No se pudo guardar la foto en tu perfil: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
        [{ text: 'OK', onPress: hideAlert }]
      );
      setProfilePictureUri(
        user?.foto_perfil_url ||
          'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      ); 
    } finally {
      setIsUploading(false);
    }
  };

  const renderListHeader = () => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Mi Perfil</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={openNotifications}>
            <Ionicons name="notifications" size={28} color="#d500ff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#d500ff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PERFIL */}
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage} disabled={isUploading}>
          <Image source={{ uri: profilePictureUri }} style={styles.avatar} />
          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <ThemedText style={styles.userName}>
          {user?.nombre_usuario || 'Usuario'}
        </ThemedText>
        <ThemedText style={styles.userEmail}>{user?.email || ''}</ThemedText>

        <View style={styles.ratingContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < 4 ? 'star' : 'star-half'}
              size={18}
              color="#FFD700"
            />
          ))}
          <Text style={styles.ratingText}>4.5</Text>
        </View>
      </View>

      {/* Sección de Configuración */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => router.push('/(tabs)/ubicacion')}
        >
          <View style={styles.settingIcon}>
            <Ionicons name="location" size={24} color="#d500ff" />
          </View>
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingTitle}>Configurar Ubicación</ThemedText>
            <Text style={styles.settingDescription}>
              Establece tu ubicación y radio de búsqueda
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Título de la sección de libros */}
      <Text style={styles.sectionTitle}>Mis Libros</Text>
    </>
  );

  const renderEmptyList = () => {
    if (loadingLibros && !refreshing) {
      return (
        <ActivityIndicator
          size="large"
          color="#d500ff"
          style={{ marginTop: 20 }}
        />
      );
    }
    if (!loadingLibros && libros.length === 0) {
      return (
        <Text style={styles.noBooksText}>
          Aún no tienes libros registrados 📚
        </Text>
      );
    }
    return null; 
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}>
      <ThemedView style={styles.container}>
        <FlatList
          data={libros}
          keyExtractor={(item) => item.id_libro.toString()}
          numColumns={2}
          contentContainerStyle={styles.bookList}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#d500ff']} 
              tintColor={'#d500ff'} 
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookCard}
              activeOpacity={0.7}
              onPress={() => handleBookPress(item.id_libro)}
            >
              <Image
                source={{
                  uri:
                    item.imagenes?.[0]?.url_imagen ||
                    'https://cdn-icons-png.flaticon.com/512/29/29302.png',
                }}
                style={styles.bookImage}
              />
              <Text style={styles.bookTitle} numberOfLines={1}>
                {item.titulo}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* MODAL NOTIFICACIONES (Se mantiene fuera del scroll) */}
        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}>
          {/* ... (Contenido del modal) ... */}
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Notificaciones</ThemedText>
                <View style={styles.modalHeaderActions}>
                  {notifications.some((n) => n.leida) && (
                    <TouchableOpacity
                      onPress={handleDeleteReadNotifications}
                      style={styles.deleteButton}>
                      <Ionicons
                        name="trash-outline"
                        size={24}
                        color="#ff4444"
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowNotifications(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#d500ff" />
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={60}
                    color="#666"
                  />
                  <ThemedText style={styles.emptyText}>
                    No tienes notificaciones
                  </ThemedText>
                </View>
              ) : (
                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id_notificacion.toString()}
                  contentContainerStyle={styles.notificationsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.notificationItem,
                        !item.leida && styles.notificationItemUnread,
                      ]}
                      onPress={() => handleNotificationPress(item)}>
                      <View style={styles.notificationIcon}>
                        <Ionicons
                          name={
                            item.tipo === 'solicitud_intercambio'
                              ? 'swap-horizontal'
                              : item.tipo === 'intercambio_aceptado'
                              ? 'checkmark-circle'
                              : item.tipo === 'intercambio_rechazado'
                              ? 'close-circle'
                              : 'chatbubble'
                          }
                          size={24}
                          color={!item.leida ? '#d500ff' : '#666'}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <ThemedText style={styles.notificationText}>
                          {item.mensaje}
                        </ThemedText>
                        <ThemedText style={styles.notificationDate}>
                          {formatDate(item.fecha_creacion)}
                        </ThemedText>
                      </View>
                      {!item.leida && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* 5. Añadir el componente CustomAlert al final */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />

        {/* ImagePickerSheet para seleccionar foto de perfil */}
        <ImagePickerSheet
          visible={imagePickerVisible}
          onClose={() => setImagePickerVisible(false)}
          onCamera={handleCameraSelect}
          onGallery={handleGallerySelect}
        />

      </ThemedView>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  // Container ahora solo da padding horizontal
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 20, // Añadimos padding superior que estaba en el container
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellButton: { position: 'relative' },
  logoutIconButton: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  userEmail: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 3,
  },
  ratingText: { color: '#fff', marginLeft: 5, fontSize: 14 },
  settingsSection: {
    marginVertical: 12,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noBooksText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  // bookList ahora con más padding para evitar que la barra de navegación tape los libros
  bookList: {
    paddingBottom: 100,
  },
  bookCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignItems: 'center',
    margin: 8,
    padding: 10,
    flex: 1,
    maxWidth: '48%',
  },
  bookImage: { width: 100, height: 140, borderRadius: 8, marginBottom: 8 },
  bookTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteButton: { padding: 4 },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { marginTop: 16, fontSize: 16, color: '#666' },
  notificationsList: { paddingBottom: 20 },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'flex-start',
  },
  notificationItemUnread: { backgroundColor: '#1a1a2e' },
  notificationIcon: { marginRight: 12, marginTop: 2 },
  notificationContent: { flex: 1 },
  notificationText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  notificationDate: { fontSize: 12, color: '#888', marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d500ff',
    marginLeft: 8,
    marginTop: 8,
  },
});