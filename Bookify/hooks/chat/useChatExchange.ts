import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { buildApiUrl, API_CONFIG } from '../../config/api';

export interface ExchangeBook {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion: string;
  imagenes: Array<{ url_imagen: string }>;
  propietario: {
    id_usuario: number;
    nombre_usuario: string;
  };
}

export interface ExchangeInfo {
  id_intercambio: number;
  id_libro_solicitado: number;
  id_libro_ofertado: number | null;
  id_usuario_solicitante: number;
  id_usuario_solicitante_receptor: number;
  estado_propuesta: 'pending' | 'accepted' | 'rejected' | 'completed';
  libro_solicitado: ExchangeBook;
  libro_ofertado: ExchangeBook | null;
  // Campos de ubicación de encuentro
  ubicacion_encuentro_lat?: number;
  ubicacion_encuentro_lng?: number;
  ubicacion_encuentro_nombre?: string;
  ubicacion_encuentro_direccion?: string;
  ubicacion_encuentro_place_id?: string;
  // Campos de confirmación bilateral
  confirmacion_solicitante?: boolean;
  confirmacion_receptor?: boolean;
  // Nombres de usuarios
  nombre_usuario_solicitante?: string;
  nombre_usuario_receptor?: string;
}

export function useChatExchange(chatId: number, currentUserId?: number) {
  const [exchange, setExchange] = useState<ExchangeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSelectBook, setCanSelectBook] = useState(false);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setLoading(false);
      return;
    }
    
    loadExchangeInfo();
    
    // Polling cada 15 segundos SOLO para el endpoint ligero
    const interval = setInterval(() => {
      loadExchangeInfoSilent();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [chatId, currentUserId]);

  const loadExchangeInfo = async () => {
    try {
      setLoading(true);
      
      // USAR ENDPOINT COMPUESTO para reducir queries
      // En lugar de /chat/:chatId/exchange, usar /chat/:chatId/payload
      // Este endpoint ya combina chat + exchange + participants en una sola query
      const response = await fetch(`${buildApiUrl('')}/chat/${chatId}/exchange`);
      
      if (!response.ok) {
        throw new Error('Error al cargar información del intercambio');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setExchange(data.data);
        
        // El receptor puede seleccionar libro si aún no hay libro ofertado
        const isReceiver = currentUserId === data.data.id_usuario_solicitante_receptor;
        const hasNoOfferedBook = !data.data.id_libro_ofertado;
        setCanSelectBook(isReceiver && hasNoOfferedBook);
      } else {
        setExchange(null);
      }
    } catch (error) {
      console.error('[useChatExchange] Error:', error);
      setExchange(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeInfoSilent = async () => {
    try {
      // Usar endpoint ligero solo para polling
      const response = await fetch(`${buildApiUrl('')}/chat/${chatId}/exchange-status`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Solo actualizar si hay cambios en confirmaciones o ubicación
        setExchange((prevExchange) => {
          if (!prevExchange) {
            // Si no hay exchange previo, cargar completo
            loadExchangeInfo();
            return prevExchange;
          }
          
          const hasChanges = 
            prevExchange.confirmacion_solicitante !== data.data.confirmacion_solicitante ||
            prevExchange.confirmacion_receptor !== data.data.confirmacion_receptor ||
            prevExchange.ubicacion_encuentro_nombre !== data.data.ubicacion_encuentro_nombre ||
            prevExchange.ubicacion_encuentro_lat !== data.data.ubicacion_encuentro_lat ||
            prevExchange.id_libro_ofertado !== data.data.id_libro_ofertado;
          
          if (hasChanges) {
            console.log('[useChatExchange] Cambios detectados, recargando datos completos...');
            // Si hay cambios, cargar datos completos
            loadExchangeInfo();
          }
          
          return prevExchange;
        });
      }
    } catch (error) {
      // Silenciar errores en polling
      console.log('[useChatExchange] Error en polling silencioso:', error);
    }
  };

  const selectOfferedBook = async (bookId: number) => {
    if (!exchange || !canSelectBook) {
      Alert.alert('Error', 'No puedes seleccionar un libro en este momento');
      return false;
    }

    try {
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${exchange.id_intercambio}/offer-book`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_libro_ofertado: bookId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al seleccionar libro');
      }

      const data = await response.json();
      
      if (data.success) {
        await loadExchangeInfo(); // Recargar información
        Alert.alert('Éxito', 'Libro ofrecido correctamente');
        return true;
      } else {
        throw new Error(data.message || 'Error al seleccionar libro');
      }
    } catch (error) {
      console.error('[selectOfferedBook] Error:', error);
      Alert.alert('Error', 'No se pudo ofrecer el libro');
      return false;
    }
  };

  return {
    exchange,
    loading,
    canSelectBook,
    selectOfferedBook,
    reloadExchange: loadExchangeInfo,
  };
}
