import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { buildApiUrl } from '@/config/api';
import { Notification } from './useNotifications';

interface UseExchangeActionsProps {
  userId: number | undefined;
  showAlert: (title: string, message: string, buttons: any[]) => void;
  hideAlert: () => void;
  markAsRead: (notification: Notification) => Promise<void>;
  loadNotifications: () => Promise<void>;
  closeNotifications: () => void;
}

export function useExchangeActions({
  userId,
  showAlert,
  hideAlert,
  markAsRead,
  loadNotifications,
  closeNotifications,
}: UseExchangeActionsProps) {
  const router = useRouter();

  const handleNotificationPress = useCallback(async (notification: Notification) => {
   
    markAsRead(notification);
    
    
    if (notification.tipo === 'solicitud_intercambio' && notification.intercambio) {
     
      closeNotifications();
      setTimeout(() => {
        showExchangeOptions(notification);
      }, 100);
    } else if (notification.tipo === 'intercambio_aceptado' && notification.intercambio) {
      
      closeNotifications();
      
      // Obtener el ID del chat asociado al intercambio
      try {
        const response = await fetch(
          buildApiUrl(`/api/exchange/${notification.intercambio.id_intercambio}`)
        );
        const result = await response.json();

        if (result.success && result.data?.id_chat) {
          const otherUserName = notification.usuario_emisor?.nombre_usuario || 'Usuario';

          setTimeout(() => {
            showAlert(
              '¡Solicitud Aceptada!',
              `${otherUserName} ha aceptado tu solicitud de intercambio. Ya puedes conversar.`,
              [
                {
                  text: 'Ir al Chat',
                  onPress: () => {
                    hideAlert();
                    setTimeout(() => {
                      router.push(`/chat/${result.data.id_chat}?userName=${encodeURIComponent(otherUserName)}`);
                    }, 100);
                  },
                },
                {
                  text: 'Después',
                  style: 'cancel',
                  onPress: () => {
                    hideAlert();
                  },
                },
              ]
            );
          }, 100);
        } else {
          setTimeout(() => {
            showAlert('Info', 'El chat aún no está disponible para este intercambio', [
              { text: 'OK' }
            ]);
          }, 100);
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        setTimeout(() => {
          showAlert('Error', 'No se pudo abrir el chat', [
            { text: 'OK' }
          ]);
        }, 100);
      }
    } else {
      
      closeNotifications();
    }
  }, [showAlert, markAsRead, closeNotifications, router]);

  const showExchangeOptions = useCallback((notification: Notification) => {
    if (!notification.intercambio || !notification.usuario_emisor) return;

    const senderName = notification.usuario_emisor.nombre_usuario;
    const senderId = notification.usuario_emisor.id_usuario;
    const exchangeId = notification.intercambio.id_intercambio;

    showAlert(
      'Solicitud de Intercambio',
      `${senderName} quiere intercambiar un libro contigo`,
      [
        {
          text: 'Aceptar',
          onPress: () => handleExchangeResponse(exchangeId, 'accepted', notification),
        },
        {
          text: 'Ver Perfil',
          onPress: () => {
            hideAlert();
            closeNotifications();
            // Navegar al perfil del usuario que envió la solicitud
            router.push(`/perfil/${senderId}`);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            hideAlert();
          },
        },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => handleExchangeResponse(exchangeId, 'rejected', notification),
        },
      ]
    );
  }, [showAlert, closeNotifications]);

  const handleExchangeResponse = useCallback(async (
    exchangeId: number,
    action: 'accepted' | 'rejected',
    notification: Notification
  ) => {
    if (!userId) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/exchange/${exchangeId}?userId=${userId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado_propuesta: action }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Marcar notificación como leída
        await markAsRead(notification);

        // Recargar notificaciones
        loadNotifications();

        // Si fue aceptado, navegar al chat
        if (action === 'accepted' && result.data?.id_chat) {
          closeNotifications();

          showAlert(
            '¡Intercambio Aceptado!',
            'El chat se ha creado. Puedes empezar a conversar con el usuario.',
            [
              {
                text: 'Ir al Chat',
                onPress: () => {
                  hideAlert();
                  setTimeout(() => {
                    const otherUserName = notification.usuario_emisor?.nombre_usuario || 'Usuario';
                    router.push(`/chat/${result.data.id_chat}?userName=${encodeURIComponent(otherUserName)}`);
                  }, 100);
                },
              },
              {
                text: 'Después',
                style: 'cancel',
                onPress: () => {
                  hideAlert();
                },
              },
            ]
          );
        } else if (action === 'accepted') {
          showAlert('Éxito', 'Intercambio aceptado. El chat estará disponible pronto.', [
            { text: 'OK' }
          ]);
        } else {
          showAlert('Solicitud Rechazada', 'Has rechazado la solicitud de intercambio.', [
            { text: 'OK' }
          ]);
        }
      } else {
        showAlert('Error', result.message || 'No se pudo procesar la solicitud', [
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('Error responding to exchange:', error);
      showAlert('Error', 'No se pudo procesar tu respuesta', [
        { text: 'OK' }
      ]);
    }
  }, [userId, showAlert, markAsRead, loadNotifications, closeNotifications, router]);

  return {
    handleNotificationPress,
  };
}
