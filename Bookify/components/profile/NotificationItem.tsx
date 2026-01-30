import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  formatDate: (date: string) => string;
}

export default function NotificationItem({
  notification,
  onPress,
  formatDate,
}: NotificationItemProps) {
  const getIconName = (tipo: string) => {
    switch (tipo) {
      case 'solicitud_intercambio':
        return 'swap-horizontal';
      case 'intercambio_aceptado':
        return 'checkmark-circle';
      case 'intercambio_rechazado':
        return 'close-circle';
      case 'mensaje_nuevo':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      style={[
        styles.container,
        !notification.leida && styles.containerUnread
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getIconName(notification.tipo) as any}
          size={24}
          color={!notification.leida ? '#d500ff' : '#666'}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>
          {notification.mensaje}
        </Text>
        <Text style={styles.date}>
          {formatDate(notification.fecha_creacion)}
        </Text>
      </View>
      
      {!notification.leida && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'flex-start',
  },
  containerUnread: {
    backgroundColor: '#1a1a2e',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  date: {
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
