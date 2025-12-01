import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExchangeInfo } from '../../hooks/chat/useChatExchange';
import { ExchangeDetailsModal } from './ExchangeDetailsModal';

interface ExchangeBookCardProps {
  exchange: ExchangeInfo;
  canSelectBook: boolean;
  onSelectBook: () => void;
  currentUserId?: number;
  onExchangeUpdate?: () => void;
}

const ExchangeBookCardComponent = ({
  exchange,
  canSelectBook,
  onSelectBook,
  currentUserId,
  onExchangeUpdate,
}: ExchangeBookCardProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const hasLocation = !!(exchange.ubicacion_encuentro_nombre && exchange.ubicacion_encuentro_lat);
  const bothConfirmed = exchange.confirmacion_solicitante && exchange.confirmacion_receptor;

  const getStatusInfo = () => {
    if (bothConfirmed) {
      return {
        icon: 'checkmark-circle' as const,
        color: '#4CAF50',
        text: 'Intercambio confirmado',
      };
    }
    if (hasLocation) {
      return {
        icon: 'time-outline' as const,
        color: '#FFA726',
        text: 'Pendiente de confirmación',
      };
    }
    if (exchange.libro_ofertado) {
      return {
        icon: 'location-outline' as const,
        color: '#d500ff',
        text: 'Falta seleccionar ubicación',
      };
    }
    return {
      icon: 'book-outline' as const,
      color: '#999',
      text: 'Esperando libro ofertado',
    };
  };

  const status = getStatusInfo();

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="swap-horizontal" size={24} color="#d500ff" />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Intercambio Activo</Text>
              <View style={styles.statusRow}>
                <Ionicons name={status.icon} size={14} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Libro solicitado:</Text>
          <Text style={styles.previewValue} numberOfLines={1}>
            {exchange.libro_solicitado.titulo}
          </Text>
        </View>

        {exchange.libro_ofertado && (
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Libro ofrecido:</Text>
            <Text style={styles.previewValue} numberOfLines={1}>
              {exchange.libro_ofertado.titulo}
            </Text>
          </View>
        )}

        {hasLocation && (
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Ubicación:</Text>
            <Text style={styles.previewValue} numberOfLines={1}>
              {exchange.ubicacion_encuentro_nombre}
            </Text>
          </View>
        )}

        <Text style={styles.tapHint}>Toca para ver detalles completos</Text>
      </TouchableOpacity>

      <ExchangeDetailsModal
        visible={modalVisible}
        exchange={exchange}
        canSelectBook={canSelectBook}
        onSelectBook={onSelectBook}
        currentUserId={currentUserId}
        onExchangeUpdate={onExchangeUpdate}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginRight: 8,
    minWidth: 100,
  },
  previewValue: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  tapHint: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
// Exportar componente memoizado con comparación personalizada
export const ExchangeBookCard = memo(ExchangeBookCardComponent, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian estos valores críticos
  return (
    prevProps.exchange.id_intercambio === nextProps.exchange.id_intercambio &&
    prevProps.exchange.id_libro_ofertado === nextProps.exchange.id_libro_ofertado &&
    prevProps.exchange.confirmacion_solicitante === nextProps.exchange.confirmacion_solicitante &&
    prevProps.exchange.confirmacion_receptor === nextProps.exchange.confirmacion_receptor &&
    prevProps.exchange.ubicacion_encuentro_nombre === nextProps.exchange.ubicacion_encuentro_nombre &&
    prevProps.exchange.ubicacion_encuentro_lat === nextProps.exchange.ubicacion_encuentro_lat &&
    prevProps.canSelectBook === nextProps.canSelectBook &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});
