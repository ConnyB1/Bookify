import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExchangeInfo } from '../../hooks/chat/useChatExchange';

interface ExchangeSelectorProps {
  exchanges: ExchangeInfo[];
  selectedExchangeId?: number;
  onSelectExchange: (exchangeId: number) => void;
  currentUserId?: number;
  onOpenDetails: (exchange: ExchangeInfo) => void;
}

export function ExchangeSelector({ exchanges, selectedExchangeId, onSelectExchange, currentUserId, onOpenDetails }: ExchangeSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="swap-horizontal-outline" size={18} color="#d500ff" />
        <Text style={styles.headerText}>INTERCAMBIOS ACTIVOS ({exchanges.length})</Text>
      </View>
      
      {exchanges.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No hay intercambios activos por el momento</Text>
          <Text style={styles.emptySubtext}>Los intercambios aparecerán aquí una vez aceptados</Text>
        </View>
      ) : exchanges.length === 1 ? (
        // Si solo hay un intercambio, mostrar una tarjeta estática
        <View style={styles.singleExchangeContainer}>
          {(() => {
            const exchange = exchanges[0];
            const isSelected = exchange.id_intercambio === selectedExchangeId;
            const bothConfirmed = exchange.confirmacion_solicitante && exchange.confirmacion_receptor;
            const isSolicitante = currentUserId === exchange.id_usuario_solicitante;
            const libroPido = isSolicitante ? exchange.libro_solicitado : exchange.libro_ofertado;
            const libroMePiden = isSolicitante ? exchange.libro_ofertado : exchange.libro_solicitado;
            
            return (
              <TouchableOpacity
                style={[styles.exchangeCard, isSelected && styles.exchangeCardSelected]}
                onPress={() => {
                  onSelectExchange(exchange.id_intercambio);
                  onOpenDetails(exchange);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.statusIndicator, bothConfirmed && styles.statusCompleted]}>
                  <Ionicons 
                    name={bothConfirmed ? 'checkmark-circle' : 'time-outline'} 
                    size={14} 
                    color={bothConfirmed ? '#4CAF50' : '#FFA726'} 
                  />
                </View>
                <View style={styles.booksRow}>
                  <View style={styles.bookSection}>
                    <Text style={styles.sectionLabel}>Libro que pido</Text>
                    <Image
                      source={{
                        uri: libroPido?.imagenes?.[0]?.url_imagen || 
                          'https://via.placeholder.com/50x75/333/fff',
                      }}
                      style={styles.bookImage}
                    />
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {libroPido?.titulo || 'Sin seleccionar'}
                    </Text>
                  </View>
                  <View style={styles.exchangeIconContainer}>
                    <Ionicons name="swap-horizontal" size={20} color="#d500ff" />
                  </View>
                  <View style={styles.bookSection}>
                    <Text style={styles.sectionLabel}>Libro que me piden</Text>
                    <Image
                      source={{
                        uri: libroMePiden?.imagenes?.[0]?.url_imagen || 
                          'https://via.placeholder.com/50x75/333/fff',
                      }}
                      style={styles.bookImage}
                    />
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {libroMePiden?.titulo || 'Esperando...'}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })()}
        </View>
      ) : (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exchanges.map((exchange) => {
          const isSelected = exchange.id_intercambio === selectedExchangeId;
          const bothConfirmed = exchange.confirmacion_solicitante && exchange.confirmacion_receptor;
          
          // Determinar qué libros mostrar según el usuario actual
          const isSolicitante = currentUserId === exchange.id_usuario_solicitante;
          const libroPido = isSolicitante ? exchange.libro_solicitado : exchange.libro_ofertado;
          const libroMePiden = isSolicitante ? exchange.libro_ofertado : exchange.libro_solicitado;
          
          return (
            <TouchableOpacity
              key={exchange.id_intercambio}
              style={[styles.exchangeCard, isSelected && styles.exchangeCardSelected]}
              onPress={() => {
                onSelectExchange(exchange.id_intercambio);
                onOpenDetails(exchange);
              }}
              activeOpacity={0.7}
            >
              {/* Estado visual */}
              <View style={[styles.statusIndicator, bothConfirmed && styles.statusCompleted]}>
                <Ionicons 
                  name={bothConfirmed ? 'checkmark-circle' : 'time-outline'} 
                  size={14} 
                  color={bothConfirmed ? '#4CAF50' : '#FFA726'} 
                />
              </View>

              {/* Layout horizontal: libro que pido | icono | libro que me piden */}
              <View style={styles.booksRow}>
                {/* Sección: Libro que pido */}
                <View style={styles.bookSection}>
                  <Text style={styles.sectionLabel}>Libro que pido</Text>
                  <Image
                    source={{
                      uri: libroPido?.imagenes?.[0]?.url_imagen || 
                        'https://via.placeholder.com/50x75/333/fff',
                    }}
                    style={styles.bookImage}
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {libroPido?.titulo || 'Sin seleccionar'}
                  </Text>
                </View>

                {/* Icono de intercambio */}
                <View style={styles.exchangeIconContainer}>
                  <Ionicons name="swap-horizontal" size={20} color="#d500ff" />
                </View>

                {/* Sección: Libro que me piden */}
                <View style={styles.bookSection}>
                  <Text style={styles.sectionLabel}>Libro que me piden</Text>
                  <Image
                    source={{
                      uri: libroMePiden?.imagenes?.[0]?.url_imagen || 
                        'https://via.placeholder.com/50x75/333/fff',
                    }}
                    style={styles.bookImage}
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {libroMePiden?.titulo || 'Esperando...'}
                  </Text>
                </View>
              </View>

              {/* Badge de seleccionado */}
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  exchangeCard: {
    backgroundColor: '#151718',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    width: 280,
    position: 'relative',
  },
  exchangeCardSelected: {
    borderColor: '#d500ff',
    backgroundColor: '#2A1A3A',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  statusCompleted: {
    backgroundColor: '#1B3A1E',
  },
  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bookSection: {
    flex: 1,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bookImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  exchangeIconContainer: {
    alignSelf: 'center',
    marginTop: 50,
    paddingHorizontal: 4,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#d500ff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  singleExchangeContainer: {
    paddingHorizontal: 16,
  },
});
