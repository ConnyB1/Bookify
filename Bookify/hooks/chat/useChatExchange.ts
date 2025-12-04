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
  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canSelectBook, setCanSelectBook] = useState(false);
  const lastStatusRef = useRef<string>(''); // Para rastrear el último estado

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setLoading(false);
      return;
    }
    
    loadExchangeInfo();
    // Polling cada 10 segundos (reducido para evitar bucles infinitos)
    const interval = setInterval(() => {
      loadExchangeInfoSilent();
    }, 10000);
    
    return () => {
      clearInterval(interval);
      // Limpiar el ref al desmontar
      lastStatusRef.current = '';
    };
  }, [chatId, currentUserId]);

  const loadExchangeInfo = async () => {
    try {
      setLoading(true);
      const url = `${buildApiUrl('')}/chat/${chatId}/exchanges`;
      console.log('[useChatExchange] Fetching from:', url);
      
      const response = await fetch(url);
      
      console.log('[useChatExchange] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useChatExchange] Error response:', errorText);
        throw new Error('Error al cargar información de intercambios');
      }

      const data = await response.json();
      console.log('[useChatExchange] Data received:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('[useChatExchange] Found', data.data.length, 'exchanges');
        setExchanges(data.data);
        
        // Si no hay intercambio seleccionado, seleccionar el primero
        if (!selectedExchange) {
          const firstExchange = data.data[0];
          setSelectedExchange(firstExchange);
          
          const isReceiver = currentUserId === firstExchange.id_usuario_solicitante_receptor;
          const hasNoOfferedBook = !firstExchange.id_libro_ofertado;
          setCanSelectBook(isReceiver && hasNoOfferedBook);
        } else {
          // Actualizar el intercambio seleccionado con los nuevos datos
          const updatedSelectedExchange = data.data.find(
            (ex: ExchangeInfo) => ex.id_intercambio === selectedExchange.id_intercambio
          );
          if (updatedSelectedExchange) {
            setSelectedExchange(updatedSelectedExchange);
            
            const isReceiver = currentUserId === updatedSelectedExchange.id_usuario_solicitante_receptor;
            const hasNoOfferedBook = !updatedSelectedExchange.id_libro_ofertado;
            setCanSelectBook(isReceiver && hasNoOfferedBook);
          } else {
            // El intercambio seleccionado ya no existe, limpiarlo
            console.log('[useChatExchange] Selected exchange no longer exists, clearing');
            setSelectedExchange(null);
            setCanSelectBook(false);
          }
        }
      } else {
        console.log('[useChatExchange] No exchanges found');
        setExchanges([]);
        setSelectedExchange(null);
        setCanSelectBook(false);
      }
    } catch (error) {
      console.error('[useChatExchange] Error:', error);
      setExchanges([]);
      setSelectedExchange(null);
      setCanSelectBook(false);
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeInfoSilent = async () => {
    try {
      const response = await fetch(`${buildApiUrl('')}/chat/${chatId}/exchanges`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Crear un hash del estado actual para comparar
        const currentStatusHash = JSON.stringify({
          count: data.data?.length || 0,
          exchanges: data.data?.map((ex: ExchangeInfo) => ({
            id: ex.id_intercambio,
            id_libro_ofertado: ex.id_libro_ofertado,
            confirmacion_solicitante: ex.confirmacion_solicitante,
            confirmacion_receptor: ex.confirmacion_receptor,
            ubicacion_encuentro_nombre: ex.ubicacion_encuentro_nombre,
          })) || []
        });
        
        // Solo recargar si el hash cambió
        if (lastStatusRef.current !== currentStatusHash) {
          console.log('[useChatExchange] Status changed, reloading');
          lastStatusRef.current = currentStatusHash;
          loadExchangeInfo();
        }
      }
    } catch (error) {
      // Silenciar error para no spamear la consola
    }
  };

  const selectExchange = (exchangeId: number) => {
    const exchange = exchanges.find(ex => ex.id_intercambio === exchangeId);
    if (exchange) {
      setSelectedExchange(exchange);
      
      const isReceiver = currentUserId === exchange.id_usuario_solicitante_receptor;
      const hasNoOfferedBook = !exchange.id_libro_ofertado;
      setCanSelectBook(isReceiver && hasNoOfferedBook);
    }
  };

  const selectOfferedBook = async (bookId: number) => {
    if (!selectedExchange || !canSelectBook) {
      Alert.alert('Error', 'No puedes seleccionar un libro en este momento');
      return false;
    }

    try {
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${selectedExchange.id_intercambio}/offer-book`,
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
    exchanges,
    selectedExchange,
    exchange: selectedExchange, // Para compatibilidad con código existente
    loading,
    canSelectBook,
    selectExchange,
    selectOfferedBook,
    reloadExchange: loadExchangeInfo,
  };
}
