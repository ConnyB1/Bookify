import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  onNotificationPress: (notification: Notification) => void;
  onDeletePress: () => void;
  formatDate: (date: string) => string;
}

export default function NotificationModal({
  visible,
  onClose,
  notifications,
  loading,
  onNotificationPress,
  onDeletePress,
  formatDate,
}: NotificationModalProps) {
  const hasReadNotifications = notifications.some(n => n.leida);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            
            <View style={styles.modalHeaderActions}>
              {hasReadNotifications && (
                <TouchableOpacity onPress={onDeletePress} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d500ff" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#444" />
              <Text style={styles.emptyText}>
                No tienes notificaciones
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={({ item }) => (
                <NotificationItem
                  notification={item}
                  onPress={onNotificationPress}
                  formatDate={formatDate}
                />
              )}
              keyExtractor={(item) => item.id_notificacion.toString()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
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
});
