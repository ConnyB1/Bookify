import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList, 
  ActivityIndicator,
  RefreshControl,
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
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';
import ImagePickerSheet from '@/components/ImagePickerSheet';
import GenrePreferencesModal from '@/components/GenrePreferencesModal';
import { useUserRating } from '@/hooks/Perfil/useUserRating';
import { useUserBooks } from '@/hooks/Perfil/useUserBooks';
import { useProfileImage } from '@/hooks/Perfil/useProfileImage';
import { useGenrePreferences } from '@/hooks/Perfil/useGenrePreferences';
import ProfileCard from '@/components/profile/ProfileCard';
import SettingsMenu from '@/components/profile/SettingsMenu';
import LocationSettingButton from '@/components/profile/LocationSettingButton';
import BookItem from '@/components/Bookify-componentes/comp.libro';

interface LibroDTO {
  id_libro: number;
  titulo: string;
  imagenes?: { url_imagen: string }[];
}

interface RatingDataDTO {
  promedio: number;
  total_calificaciones: number;
  calificaciones: any[];
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showGenrePreferences, setShowGenrePreferences] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const { ratingData, loadingRating, fetchUserRating } = useUserRating(user?.id_usuario);
  const { libros, loadingLibros, refreshing, fetchLibros, onRefresh: refreshBooks } = useUserBooks({
    userId: user?.id_usuario,
    onError: (message) => showAlert('Error', message, [{ text: 'OK', onPress: hideAlert }])
  });
  const { profilePictureUri, isUploading, handleGallerySelect, handleCameraSelect, setProfilePictureUri } = useProfileImage({
    userId: user?.id_usuario,
    tokens,
    initialImageUrl: user?.foto_perfil_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    onSuccess: (message) => showAlert('Éxito', message, [{ text: 'Genial', onPress: hideAlert }]),
    onError: (message) => showAlert('Error', message, [{ text: 'OK', onPress: hideAlert }]),
    updateUser
  });
  const { userGenrePreferences, loadUserGenrePreferences, saveGenrePreferences } = useGenrePreferences(user?.id_usuario);

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

  useEffect(() => {
    loadUserGenrePreferences();
  }, [user?.id_usuario]);


  const onRefresh = useCallback(async () => {
    await Promise.all([refreshBooks(), loadNotifications(), fetchUserRating()]);
  }, [refreshBooks, loadNotifications, fetchUserRating]);

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

  const handleSaveGenrePreferences = async (selectedGenres: number[]) => {
    await saveGenrePreferences(
      selectedGenres,
      () => {
        showAlert('Éxito', 'Tus preferencias de géneros han sido guardadas', [
          { text: 'Genial', onPress: hideAlert }
        ]);
      },
      () => {
        showAlert('Error', 'No se pudieron guardar tus preferencias', [
          { text: 'OK', onPress: hideAlert }
        ]);
      }
    );
  };

  const handleLogout = () => {
    setShowSettingsMenu(false); // Cerrar menú primero
    setTimeout(() => {
      showAlert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: async () => {
              hideAlert();
              await logout();
            },
          },
        ],
      );
    }, 100);
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
            style={styles.settingsIconButton}
            onPress={() => setShowSettingsMenu(!showSettingsMenu)}>
            <Ionicons name="settings-outline" size={28} color="#d500ff" />
          </TouchableOpacity>
        </View>
      </View>

      <SettingsMenu
        visible={showSettingsMenu}
        onGenrePreferencesPress={() => {
          setShowSettingsMenu(false);
          setShowGenrePreferences(true);
        }}
        onLogoutPress={handleLogout}
      />

      <ProfileCard
        profilePictureUri={profilePictureUri}
        userName={user?.nombre_usuario || 'Usuario'}
        userEmail={user?.email || ''}
        isUploading={isUploading}
        onImagePress={pickImage}
        ratingData={ratingData}
        loadingRating={loadingRating}
      />

      <View style={styles.settingsSection}>
        <LocationSettingButton onPress={() => router.push('/(tabs)/ubicacion')} />
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
            <BookItem
              id={item.id_libro}
              title={item.titulo}
              image={item.imagenes?.[0]?.url_imagen || 'https://cdn-icons-png.flaticon.com/512/29/29302.png'}
              genres={[]}
              onInfoPress={handleBookPress}
            />
          )}
        />

        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}>
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

        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />

        <ImagePickerSheet
          visible={imagePickerVisible}
          onClose={() => setImagePickerVisible(false)}
          onCamera={handleCameraSelect}
          onGallery={handleGallerySelect}
        />

        <GenrePreferencesModal
          visible={showGenrePreferences}
          onClose={() => setShowGenrePreferences(false)}
          onSave={handleSaveGenrePreferences}
          initialSelectedGenres={userGenrePreferences}
        />

      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellButton: { position: 'relative' },
  settingsIconButton: { padding: 4 },
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
  settingsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 16,
  },
  noBooksText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  bookList: {
    paddingBottom: 100,
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