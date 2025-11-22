import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/utils/apiClient';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook para manejar notificaciones push de Expo
 * Se registra automáticamente cuando el usuario está autenticado
 * 
 * ⚠️ IMPORTANTE: Las notificaciones push en Android NO funcionan en Expo Go desde SDK 53.
 * Para probar notificaciones en Android, necesitas crear un Development Build.
 * 
 * @param isAuthenticated - Si el usuario está autenticado
 * @returns { expoPushToken, notification, notificationData }
 */
export function useNotificaciones(isAuthenticated: boolean = false) {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // ⚠️ NOTIFICACIONES PUSH DESACTIVADAS TEMPORALMENTE
    // Las notificaciones push en Android no funcionan en Expo Go (SDK 53+)
    // Para activarlas, necesitas crear un Development Build:
    // 1. npx expo install expo-dev-client
    // 2. npx expo run:android
    // 3. Descomentar el código abajo
    
    console.log('ℹ️ Notificaciones push desactivadas (requiere Development Build)');
    return;

    /* CÓDIGO DESACTIVADO - Descomentar cuando tengas Development Build
    
    // Solo registrar si el usuario está autenticado
    if (!isAuthenticated) {
      return;
    }

    // 1. Registrar y obtener el token
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToBackend(token);
      }
    });

    // 2. Listener para cuando llega una notificación (app en foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
      setNotification(notification);
      
      // Opcional: Mostrar una alerta nativa
      const { title, body } = notification.request.content;
      Alert.alert(title || 'Nueva notificación', body || '');
    });

    // 3. Listener para cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó la notificación:', response);
      const data = response.notification.request.content.data;
      
      // Aquí puedes navegar según el tipo de notificación
      handleNotificationNavigation(data);
    });

    return () => {
      // Limpiar listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
    
    FIN DEL CÓDIGO DESACTIVADO */
  }, [isAuthenticated]);

  return { expoPushToken, notification };
}

/**
 * Manejar navegación según el tipo de notificación
 */
function handleNotificationNavigation(data: any) {
  if (!data || !data.type) return;

  console.log('📍 Navegando según notificación:', data);

  // Según el tipo, navegar a la pantalla correspondiente
  switch (data.type) {
    case 'chat_message':
      // Navegar al chat
      console.log('Navegar a chat:', data.chatId);
      break;
    case 'exchange_request':
    case 'exchange_accepted':
    case 'exchange_rejected':
    case 'book_offered':
    case 'meeting_location_proposed':
    case 'exchange_confirmed':
    case 'exchange_completed':
      // Navegar a notificaciones o al detalle del intercambio
      console.log('Navegar a intercambio:', data.exchangeId);
      break;
    default:
      console.log('Tipo de notificación desconocido:', data.type);
  }
}
async function saveTokenToBackend(token: string) {
  try {
    // Ajusta este endpoint a tu ruta real de actualización de usuario
    await apiClient.patch('/users/push-token', { token }); 
    console.log('Token guardado en backend');
  } catch (error) {
    console.error('Error guardando token:', error);
  }
}

// Lógica de permisos
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.warn('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
    return;
  }

  // Solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('⚠️ Permisos de notificaciones no otorgados');
    Alert.alert(
      'Permisos necesarios',
      'Para recibir notificaciones, necesitas habilitar los permisos en la configuración.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Intentar obtener el token
  try {
    // Para Expo Go en desarrollo, no necesitamos projectId
    // Solo se requiere para builds standalone/EAS
    console.log('🔑 Obteniendo token de Expo Push...');
    
    // Intento 1: Sin projectId (funciona en Expo Go)
    try {
      const response = await Notifications.getExpoPushTokenAsync();
      token = response.data;
      console.log('✅ Token obtenido exitosamente (Expo Go):', token);
    } catch (err: any) {
      // Intento 2: Con projectId si está disponible
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      
      if (projectId) {
        console.log('🔄 Reintentando con Project ID...');
        const response = await Notifications.getExpoPushTokenAsync({ projectId });
        token = response.data;
        console.log('✅ Token obtenido con Project ID:', token);
      } else {
        // No hay projectId y falló sin él
        console.error('❌ Error obteniendo token:', err.message);
        console.log('💡 Para usar notificaciones en producción, agrega un projectId en app.json');
        console.log('   Mientras tanto, las notificaciones funcionarán en Expo Go sin projectId');
        
        // No lanzar error, solo advertir
        return;
      }
    }
  } catch (error: any) {
    console.error('❌ Error crítico obteniendo push token:', error);
    return;
  }

  return token;
}