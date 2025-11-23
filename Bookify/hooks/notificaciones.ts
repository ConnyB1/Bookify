import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '@/utils/apiClient';
import { router } from 'expo-router';

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
    // Solo registrar si el usuario está autenticado
    if (!isAuthenticated) {
      console.log('ℹ️ Usuario no autenticado, notificaciones push desactivadas');
      return;
    }

    console.log('🔔 Iniciando registro de notificaciones push...');

    // 1. Registrar y obtener el token
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('✅ Token de notificaciones obtenido:', token);
        setExpoPushToken(token);
        saveTokenToBackend(token);
      } else {
        console.warn('⚠️ No se pudo obtener el token de notificaciones');
      }
    }).catch(error => {
      console.error('❌ Error en registro de notificaciones:', error);
    });

    // 2. Listener para cuando llega una notificación (app en foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
      setNotification(notification);
      
      // La notificación se mostrará como push notification nativa
      // y aparecerá en el perfil del usuario automáticamente
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
      if (data.chatId) {
        console.log('Navegar a chat:', data.chatId);
        router.push(`/chat/${data.chatId}`);
      }
      break;
    case 'exchange_request':
    case 'exchange_accepted':
    case 'exchange_rejected':
    case 'book_offered':
    case 'meeting_location_proposed':
    case 'exchange_confirmed':
    case 'exchange_completed':
      // Navegar a tu perfil para ver las notificaciones
      console.log('Navegar a perfil (notificaciones)');
      router.push('/(tabs)/perfil');
      break;
    default:
      console.log('Tipo de notificación desconocido:', data.type);
  }
}
async function saveTokenToBackend(token: string) {
  try {
    console.log('💾 Intentando guardar token en backend:', token.substring(0, 20) + '...');
    const result = await apiClient.patch('/users/push-token', { token });
    
    if (result.ok) {
      console.log('✅ Token push guardado exitosamente en el backend');
    } else {
      console.error('❌ Error al guardar token, status:', result.status, result.error);
    }
  } catch (error) {
    console.error('❌ Error crítico guardando token:', error);
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
    return;
  }

  // Intentar obtener el token
  try {
    console.log('🔑 Obteniendo token de Expo Push...');
    
    // Primero, verificar si hay un projectId en la configuración
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                     Constants?.easConfig?.projectId ||
                     Constants?.manifest2?.extra?.eas?.projectId;
    
    console.log('📋 Project ID disponible:', projectId ? 'Sí' : 'No');
    
    try {
      // Intentar con projectId si está disponible
      if (projectId) {
        console.log('🔄 Obteniendo token con Project ID...');
        const response = await Notifications.getExpoPushTokenAsync({ 
          projectId: projectId 
        });
        token = response.data;
        console.log('✅ Token obtenido exitosamente con Project ID:', token);
      } else {
        // Si no hay projectId, intentar sin él (puede funcionar en algunos casos)
        console.log('🔄 Obteniendo token sin Project ID...');
        const response = await Notifications.getExpoPushTokenAsync();
        token = response.data;
        console.log('✅ Token obtenido exitosamente sin Project ID:', token);
      }
    } catch (err: any) {
      console.error('❌ Error obteniendo token:', err.message);
      
      if (err.message.includes('projectId')) {
        // Error específico de projectId faltante
        console.log('💡 Solución: Agregando projectId automático para desarrollo...');
        
        // Generar un projectId temporal para desarrollo
        // Nota: Este token solo funcionará para pruebas locales
        try {
          const response = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id' // Placeholder
          });
          token = response.data;
          console.log('⚠️ Token de desarrollo obtenido (limitado):', token);
        } catch (finalErr: any) {
          console.error('❌ No se pudo obtener token de notificaciones:', finalErr.message);
          console.log('');
          console.log('📖 SOLUCIÓN:');
          console.log('1. Crea una cuenta EAS: npx eas-cli login');
          console.log('2. Configura el proyecto: npx eas build:configure');
          console.log('   O agrega manualmente en app.json:');
          console.log('   "extra": { "eas": { "projectId": "TU-PROJECT-ID" } }');
          return;
        }
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error('❌ Error crítico obteniendo push token:', error);
    return;
  }

  return token;
}