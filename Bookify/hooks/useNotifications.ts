import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '@/config/api';

export interface Notification {
  id_notificacion: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  usuario_emisor?: {
    id_usuario: number;
    nombre_usuario: string;
  } | null;
  intercambio?: {
    id_intercambio: number;
    estado_propuesta: string;
  } | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notification: Notification) => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
}

export function useNotifications(
  userId: number | undefined,
  showAlert: (title: string, message: string, buttons: any[]) => void
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUnreadCount();
      // Polling cada 30 segundos
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/notifications/unread-count?userId=${userId}`)
      );
      const result = await response.json();

      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl(`/api/notifications?userId=${userId}`)
      );
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      showAlert('Error', 'No se pudieron cargar las notificaciones', [
        { text: 'OK' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [userId, showAlert]);

  const markAsRead = useCallback(async (notification: Notification) => {
    if (!notification.leida && userId) {
      try {
        await fetch(
          buildApiUrl(`/api/notifications/${notification.id_notificacion}/read?userId=${userId}`),
          { method: 'PATCH' }
        );
        // Actualizar contador y lista
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n =>
            n.id_notificacion === notification.id_notificacion
              ? { ...n, leida: true }
              : n
          )
        );
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  }, [userId]);

  const deleteReadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const readNotifications = notifications.filter(n => n.leida);

      if (readNotifications.length === 0) {
        showAlert('Info', 'No hay notificaciones leídas para eliminar', [
          { text: 'OK' }
        ]);
        return;
      }

      showAlert(
        'Eliminar Notificaciones Leídas',
        `¿Deseas eliminar ${readNotifications.length} notificación${readNotifications.length !== 1 ? 'es' : ''} leída${readNotifications.length !== 1 ? 's' : ''}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                for (const notification of readNotifications) {
                  await fetch(
                    buildApiUrl(`/api/notifications/${notification.id_notificacion}?userId=${userId}`),
                    { method: 'DELETE' }
                  );
                }

                setNotifications(prev => prev.filter(n => !n.leida));

                showAlert('Éxito', 'Notificaciones leídas eliminadas', [
                  { text: 'OK' }
                ]);
              } catch (error) {
                console.error('Error deleting notifications:', error);
                showAlert('Error', 'No se pudieron eliminar las notificaciones', [
                  { text: 'OK' }
                ]);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in deleteReadNotifications:', error);
    }
  }, [userId, notifications, showAlert]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    deleteReadNotifications,
  };
}
