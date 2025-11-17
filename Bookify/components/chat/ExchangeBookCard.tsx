import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ExchangeInfo } from '../../hooks/chat/useChatExchange';
import { buildApiUrl } from '../../config/api';

interface ExchangeBookCardProps {
  exchange: ExchangeInfo;
  canSelectBook: boolean;
  onSelectBook: () => void;
  currentUserId?: number;
  onExchangeUpdate?: () => void;
}

// Componente de libro reutilizable
const BookCard = ({ book, label }: { book: any; label: string }) => (
  <View style={styles.bookSection}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.bookCard}>
      <Image
        source={{ uri: book.imagenes?.[0]?.url_imagen || 'https://via.placeholder.com/50x75/333/fff' }}
        style={styles.bookImage}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.titulo}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{book.autor}</Text>
        <Text style={styles.bookOwner}>De: {book.propietario.nombre_usuario}</Text>
      </View>
    </View>
  </View>
);

// Componente de libro vacío
const EmptyBookCard = ({ canSelect, onSelect }: { canSelect: boolean; onSelect: () => void }) => (
  <View style={styles.bookSection}>
    <Text style={styles.label}>Tu libro a ofrecer</Text>
    <View style={styles.emptyBookCard}>
      {canSelect ? (
        <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
          <Ionicons name="add-circle-outline" size={24} color="#d500ff" />
          <Text style={styles.selectButtonText}>Seleccionar mi libro</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingContainer}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <Text style={styles.waitingText}>Esperando que el dueño ofrezca un libro</Text>
        </View>
      )}
    </View>
  </View>
);

export function ExchangeBookCard({ exchange, canSelectBook, onSelectBook, currentUserId, onExchangeUpdate }: ExchangeBookCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const hasLocation = !!(exchange.ubicacion_encuentro_nombre && exchange.ubicacion_encuentro_lat);
  
  // Debug: ver qué datos tiene el exchange
  console.log('[ExchangeBookCard] Exchange data:', {
    nombre: exchange.ubicacion_encuentro_nombre,
    lat: exchange.ubicacion_encuentro_lat,
    lng: exchange.ubicacion_encuentro_lng,
    direccion: exchange.ubicacion_encuentro_direccion,
    hasLocation,
  });
  
  // Determinar si el usuario actual es el solicitante o receptor
  const isSolicitante = currentUserId === exchange.id_usuario_solicitante;
  const isReceptor = currentUserId === exchange.id_usuario_solicitante_receptor;
  
  // Estado de confirmaciones
  const userConfirmed = isSolicitante ? exchange.confirmacion_solicitante : exchange.confirmacion_receptor;
  const otherUserConfirmed = isSolicitante ? exchange.confirmacion_receptor : exchange.confirmacion_solicitante;
  const bothConfirmed = exchange.confirmacion_solicitante && exchange.confirmacion_receptor;

  const navigateToMap = () => {
    router.push({
      pathname: '/mapa',
      params: { exchangeId: exchange.id_intercambio.toString() },
    } as any);
  };

  const handleConfirm = async () => {
    if (!currentUserId) return Alert.alert('Error', 'No se pudo identificar el usuario');
    if (userConfirmed) return;
    
    try {
      setConfirming(true);
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${exchange.id_intercambio}/confirm?userId=${currentUserId}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('✅ Confirmado', 'Has confirmado el intercambio');
        if (onExchangeUpdate) {
          await onExchangeUpdate();
        }
      } else {
        throw new Error(data.message || 'Error al confirmar');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo confirmar el intercambio');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Libros */}
      <View style={styles.booksRow}>
        <BookCard book={exchange.libro_solicitado} label="Libro solicitado" />
        <View style={styles.exchangeIcon}>
          <Ionicons name="swap-horizontal" size={32} color="#d500ff" />
        </View>
        {exchange.libro_ofertado ? (
          <BookCard book={exchange.libro_ofertado} label="Libro ofrecido" />
        ) : (
          <EmptyBookCard canSelect={canSelectBook} onSelect={onSelectBook} />
        )}
      </View>

      {/* Ubicación - Solo si ambos libros están seleccionados */}
      {exchange.libro_ofertado && (
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#d500ff" />
            <Text style={styles.sectionTitle}>Lugar de Encuentro</Text>
            {hasLocation && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              </View>
            )}
          </View>

          {hasLocation ? (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={24} color="#d500ff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.locationName}>{exchange.ubicacion_encuentro_nombre}</Text>
                  {exchange.ubicacion_encuentro_direccion && (
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {exchange.ubicacion_encuentro_direccion}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.changeBtnSmall} onPress={navigateToMap}>
                <Ionicons name="pencil" size={14} color="#d500ff" />
                <Text style={styles.changeBtnTextSmall}>Cambiar ubicación</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectLocationBtn} onPress={navigateToMap}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.selectLocationText}>Seleccionar Lugar de Encuentro</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Confirmación Bilateral - Solo si hay ubicación */}
      {exchange.libro_ofertado && hasLocation && (
        <View style={styles.confirmSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={bothConfirmed ? "#4CAF50" : "#d500ff"} />
            <Text style={styles.sectionTitle}>Confirmación</Text>
            {bothConfirmed && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
              </View>
            )}
            {!bothConfirmed && (userConfirmed || otherUserConfirmed) && (
              <View style={[styles.badge, { backgroundColor: '#3A2A50' }]}>
                <Text style={{ fontSize: 10, color: '#d500ff', fontWeight: '700' }}>
                  {userConfirmed && otherUserConfirmed ? '2/2' : '1/2'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.confirmDescription}>
            Ambos usuarios deben confirmar el intercambio para completarlo
          </Text>
          
          {/* Estado de confirmaciones */}
          <View style={styles.confirmStates}>
            <View style={[styles.confirmBadge, exchange.confirmacion_solicitante && styles.confirmedBadge]}>
              <Ionicons 
                name={exchange.confirmacion_solicitante ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={exchange.confirmacion_solicitante ? "#4CAF50" : "#666"} 
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.confirmBadgeTitle, exchange.confirmacion_solicitante && styles.confirmed]}>
                  {exchange.nombre_usuario_solicitante || 'Solicitante'}
                </Text>
                <Text style={styles.confirmBadgeStatus}>
                  {exchange.confirmacion_solicitante ? 'Confirmado ✓' : 'Pendiente'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.confirmBadge, exchange.confirmacion_receptor && styles.confirmedBadge]}>
              <Ionicons 
                name={exchange.confirmacion_receptor ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={exchange.confirmacion_receptor ? "#4CAF50" : "#666"} 
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.confirmBadgeTitle, exchange.confirmacion_receptor && styles.confirmed]}>
                  {exchange.nombre_usuario_receptor || 'Receptor'}
                </Text>
                <Text style={styles.confirmBadgeStatus}>
                  {exchange.confirmacion_receptor ? 'Confirmado ✓' : 'Pendiente'}
                </Text>
              </View>
            </View>
          </View>

          {/* Botón de confirmación o estado completado */}
          {bothConfirmed ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
              <Text style={styles.completedText}>¡Intercambio Completado! 🎉</Text>
              <Text style={styles.completedSubtext}>Pueden coordinar la entrega</Text>
            </View>
          ) : (
            <>
              {!userConfirmed ? (
                <TouchableOpacity 
                  style={styles.confirmBtn} 
                  onPress={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                      <Text style={styles.confirmBtnText}>Aceptar y Confirmar Intercambio</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.waitingBanner}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.waitingTitle}>Ya confirmaste el intercambio</Text>
                    <Text style={styles.waitingSubtext}>
                      Esperando que {isSolicitante ? 'el receptor' : 'el solicitante'} también confirme
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E1E1E', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  booksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookSection: { flex: 1 },
  label: { fontSize: 11, color: '#999', marginBottom: 8, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase' },
  bookCard: { flexDirection: 'row', backgroundColor: '#252525', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#333' },
  bookImage: { width: 50, height: 75, borderRadius: 4, backgroundColor: '#333' },
  bookInfo: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  bookTitle: { fontSize: 13, fontWeight: '600', color: '#fff', marginBottom: 4 },
  bookAuthor: { fontSize: 11, color: '#999', marginBottom: 4 },
  bookOwner: { fontSize: 10, color: '#d500ff', fontWeight: '500' },
  exchangeIcon: { width: 50, alignItems: 'center', justifyContent: 'center' },
  emptyBookCard: { backgroundColor: '#252525', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', minHeight: 95, justifyContent: 'center', alignItems: 'center' },
  selectButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  selectButtonText: { fontSize: 12, color: '#d500ff', marginTop: 6, fontWeight: '600', textAlign: 'center' },
  waitingContainer: { alignItems: 'center', justifyContent: 'center' },
  waitingText: { fontSize: 11, color: '#666', marginTop: 6, textAlign: 'center' },
  // Sección de ubicación
  locationSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  badge: { backgroundColor: '#1B3A1E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  locationCard: { backgroundColor: '#252525', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#d500ff' },
  locationHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  locationName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  locationAddress: { fontSize: 13, color: '#999', lineHeight: 18 },
  changeBtnSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1E1E1E', borderRadius: 8, borderWidth: 1, borderColor: '#d500ff', alignSelf: 'flex-start' },
  changeBtnTextSmall: { fontSize: 12, fontWeight: '600', color: '#d500ff', marginLeft: 6 },
  selectLocationBtn: { backgroundColor: '#d500ff', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  selectLocationText: { fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 8 },
  // Estilos de confirmación bilateral
  confirmSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  confirmDescription: { fontSize: 12, color: '#999', marginBottom: 16, textAlign: 'center', lineHeight: 18 },
  confirmStates: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  confirmBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#252525', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: '#333' },
  confirmedBadge: { borderColor: '#4CAF50', backgroundColor: '#1B3A1E' },
  confirmBadgeTitle: { fontSize: 13, fontWeight: '700', color: '#999' },
  confirmBadgeStatus: { fontSize: 11, color: '#666', marginTop: 2 },
  confirmed: { color: '#4CAF50' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginTop: 4 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', marginLeft: 8 },
  completedBanner: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B5E20', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50' },
  completedText: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginTop: 8, marginBottom: 4 },
  completedSubtext: { fontSize: 12, color: '#81C784', textAlign: 'center' },
  waitingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#252525', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 2, borderColor: '#4CAF50' },
  waitingTitle: { fontSize: 14, fontWeight: '700', color: '#4CAF50', marginBottom: 4 },
  waitingSubtext: { fontSize: 12, color: '#999', lineHeight: 16 },
});
