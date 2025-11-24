import { useState, useEffect, useRef } from 'react';
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
  ubicacion_encuentro_lat?: number;
  ubicacion_encuentro_lng?: number;
  ubicacion_encuentro_nombre?: string;
  ubicacion_encuentro_direccion?: string;
  ubicacion_encuentro_place_id?: string;
  confirmacion_solicitante?: boolean;
  confirmacion_receptor?: boolean;
  nombre_usuario_solicitante?: string;
  nombre_usuario_receptor?: string;
}

export function useChatExchange(chatId: number, currentUserId?: number) {
  const [exchange, setExchange] = useState<ExchangeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSelectBook, setCanSelectBook] = useState(false);
  const lastStatusRef = useRef<string>(''); // Para rastrear el último estado

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setLoading(false);
      return;
    }
    
    loadExchangeInfo();
    // Polling cada 5 segundos para actualizaciones más rápidas
    const interval = setInterval(() => {
      loadExchangeInfoSilent();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [chatId, currentUserId]);

  const loadExchangeInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${buildApiUrl('')}/chat/${chatId}/exchange`);
      
      if (!response.ok) {
        throw new Error('Error al cargar información del intercambio');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setExchange(data.data);
        
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
      const response = await fetch(`${buildApiUrl('')}/chat/${chatId}/exchange-status`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Crear un hash del estado actual para comparar
        const currentStatusHash = JSON.stringify({
          id_libro_ofertado: data.data.id_libro_ofertado,
          confirmacion_solicitante: data.data.confirmacion_solicitante,
          confirmacion_receptor: data.data.confirmacion_receptor,
          ubicacion_encuentro_nombre: data.data.ubicacion_encuentro_nombre,
          ubicacion_encuentro_lat: data.data.ubicacion_encuentro_lat,
          ubicacion_encuentro_lng: data.data.ubicacion_encuentro_lng,
        });
        
        // Solo recargar si el hash cambió
        if (lastStatusRef.current !== currentStatusHash) {
          lastStatusRef.current = currentStatusHash;
          loadExchangeInfo();
        }
      }
    } catch (error) {
      // Silenciar error para no spamear la consola
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
        await loadExchangeInfo(); 
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
