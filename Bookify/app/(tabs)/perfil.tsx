import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import CustomAlert from '@/components/CustomAlert';
import { useNotifications } from '@/hooks/useNotifications';
import { useAlertDialog } from '@/hooks/useAlertDialog';
import { useExchangeActions } from '@/hooks/useExchangeActions';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Custom hooks
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();
  
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    deleteReadNotifications,
  } = useNotifications(user?.id_usuario, showAlert);

  const { handleNotificationPress } = useExchangeActions({
    userId: user?.id_usuario,
    showAlert,
    markAsRead,
    loadNotifications,
    closeNotifications: () => setShowNotifications(false),
  });

  // Funciones auxiliares
  const openNotifications = () => {
    setShowNotifications(true);
    loadNotifications();
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

  const handleLogout = () => {
    showAlert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {}, // No hacer nada al cancelar
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header con notificaciones y logout */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Mi Perfil</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellButton} onPress={openNotifications}>
              <Ionicons name="notifications" size={28} color="#d500ff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#d500ff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Ionicons name="person-circle" size={100} color="#d500ff" />
          <ThemedText style={styles.userName}>{user?.nombre_usuario || 'Usuario'}</ThemedText>
          <ThemedText style={styles.userEmail}>{user?.email || ''}</ThemedText>
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.subtitle}>Configuración de perfil próximamente</ThemedText>
        </View>

        {/* Modal de Notificaciones */}
        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Notificaciones</ThemedText>
                <View style={styles.modalHeaderActions}>
                  {notifications.some(n => n.leida) && (
                    <TouchableOpacity 
                      onPress={deleteReadNotifications}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={24} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
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
                  <Ionicons name="notifications-off-outline" size={60} color="#666" />
                  <ThemedText style={styles.emptyText}>No tienes notificaciones</ThemedText>
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
                        !item.leida && styles.notificationItemUnread
                      ]}
                      onPress={() => handleNotificationPress(item)}
                    >
                      <View style={styles.notificationIcon}>
                        <Ionicons
                          name={
                            item.tipo === 'solicitud_intercambio' ? 'swap-horizontal' :
                            item.tipo === 'intercambio_aceptado' ? 'checkmark-circle' :
                            item.tipo === 'intercambio_rechazado' ? 'close-circle' :
                            'chatbubble'
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

        {/* CustomAlert Component */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
  },
  logoutIconButton: {
    padding: 4,
  },
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
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
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
    paddingBottom: 40, // Más espacio para los botones del sistema
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
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
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notificationsList: {
    paddingBottom: 20, // Espacio extra para botones del sistema
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'flex-start',
  },
  notificationItemUnread: {
    backgroundColor: '#1a1a2e',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d500ff',
    marginLeft: 8,
    marginTop: 8,
  },
});
