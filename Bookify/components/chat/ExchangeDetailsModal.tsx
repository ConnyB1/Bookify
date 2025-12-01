import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ExchangeInfo } from '../../hooks/chat/useChatExchange';
import { buildApiUrl } from '../../config/api';
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';
import { RatingModal } from './RatingModal';

interface ExchangeDetailsModalProps {
  visible: boolean;
  exchange: ExchangeInfo | null;
  canSelectBook: boolean;
  onSelectBook: () => void;
  currentUserId?: number;
  onExchangeUpdate?: () => void;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ExchangeDetailsModal({
  visible,
  exchange,
  canSelectBook,
  onSelectBook,
  currentUserId,
  onExchangeUpdate,
  onClose,
}: ExchangeDetailsModalProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [checkingRating, setCheckingRating] = useState(true);
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  if (!exchange) return null;

  const hasLocation = !!(exchange.ubicacion_encuentro_nombre && exchange.ubicacion_encuentro_lat);
  const isSolicitante = currentUserId === exchange.id_usuario_solicitante;
  const isReceptor = currentUserId === exchange.id_usuario_solicitante_receptor;
  const userConfirmed = isSolicitante ? exchange.confirmacion_solicitante : exchange.confirmacion_receptor;
  const otherUserConfirmed = isSolicitante ? exchange.confirmacion_receptor : exchange.confirmacion_solicitante;
  const bothConfirmed = exchange.confirmacion_solicitante && exchange.confirmacion_receptor;

  // Datos del otro usuario para el rating
  const otherUserId = isSolicitante ? exchange.id_usuario_solicitante_receptor : exchange.id_usuario_solicitante;
  const otherUserName = isSolicitante 
    ? (exchange.libro_ofertado?.propietario?.nombre_usuario || 'Usuario')
    : (exchange.libro_solicitado?.propietario?.nombre_usuario || 'Usuario');
  const otherUserPhoto = isSolicitante
    ? (exchange.libro_ofertado?.propietario as any)?.foto_perfil_url
    : (exchange.libro_solicitado?.propietario as any)?.foto_perfil_url;

  // No permitir cambiar ubicación si ya se confirmó el intercambio
  const canChangeLocation = !bothConfirmed;

  // Verificar si el usuario ya calificó este intercambio
  React.useEffect(() => {
    const checkIfRated = async () => {
      if (!currentUserId || !exchange) {
        setCheckingRating(false);
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl(`/api/rating/check?exchangeId=${exchange.id_intercambio}&userId=${currentUserId}`)
        );
        const result = await response.json();
        
        if (result.success) {
          setHasRated(result.data.hasRated);
        }
      } catch (error) {
        console.error('Error checking rating:', error);
      } finally {
        setCheckingRating(false);
      }
    };

    if (visible && bothConfirmed) {
      checkIfRated();
    }
  }, [visible, exchange?.id_intercambio, currentUserId, bothConfirmed]);

  const navigateToMap = () => {
    if (!canChangeLocation) {
      showAlert(
        'No disponible',
        'No puedes cambiar la ubicación después de que ambos usuarios confirmaron el intercambio',
        [{ text: 'Entendido', onPress: hideAlert }]
      );
      return;
    }
    onClose();
    router.push({
      pathname: '/mapa',
      params: { exchangeId: exchange.id_intercambio.toString() },
    } as any);
  };

  const handleConfirm = async () => {
    if (!currentUserId) {
      return showAlert('Error', 'No se pudo identificar el usuario', [{ text: 'OK', onPress: hideAlert }]);
    }
    if (userConfirmed) return;

    try {
      setConfirming(true);
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${exchange.id_intercambio}/confirm?userId=${currentUserId}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json();
      if (data.success) {
        showAlert('Confirmado', 'Has confirmado el intercambio', [
          {
            text: 'OK',
            onPress: async () => {
              hideAlert();
              if (onExchangeUpdate) {
                await onExchangeUpdate();
              }
            },
          },
        ]);
      } else {
        throw new Error(data.message || 'Error al confirmar');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo confirmar el intercambio', [{ text: 'OK', onPress: hideAlert }]);
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelExchange = () => {
    showAlert(
      'Cancelar Intercambio',
      '¿Estás seguro de que deseas cancelar este intercambio? Esta acción no se puede deshacer.',
      [
        { text: 'No, volver', style: 'cancel', onPress: hideAlert },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            await performCancelExchange();
          },
        },
      ]
    );
  };

  const performCancelExchange = async () => {
    if (!currentUserId) {
      return showAlert('Error', 'No se pudo identificar el usuario', [{ text: 'OK', onPress: hideAlert }]);
    }

    try {
      setCanceling(true);
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${exchange.id_intercambio}/cancel?userId=${currentUserId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json();
      if (data.success) {
        showAlert('Intercambio Cancelado', 'El intercambio ha sido cancelado exitosamente', [
          {
            text: 'OK',
            onPress: async () => {
              hideAlert();
              onClose();
              if (onExchangeUpdate) {
                await onExchangeUpdate();
              }
            },
          },
        ]);
      } else {
        throw new Error(data.message || 'Error al cancelar');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo cancelar el intercambio', [{ text: 'OK', onPress: hideAlert }]);
    } finally {
      setCanceling(false);
    }
  };

  const handleDeleteFromHistory = () => {
    showAlert(
      '¿Eliminar del historial?',
      'Este intercambio completado se eliminará del historial. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            await performDeleteFromHistory();
          },
        },
      ]
    );
  };

  const performDeleteFromHistory = async () => {
    if (!currentUserId) {
      return showAlert('Error', 'No se pudo identificar el usuario', [{ text: 'OK', onPress: hideAlert }]);
    }

    try {
      setDeleting(true);
      const response = await fetch(
        `${buildApiUrl('')}/api/exchange/${exchange.id_intercambio}/cancel?userId=${currentUserId}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
      );

      const data = await response.json();
      if (data.success) {
        showAlert('Éxito', 'El intercambio ha sido eliminado del historial', [
          {
            text: 'OK',
            onPress: async () => {
              hideAlert();
              onClose();
              if (onExchangeUpdate) {
                await onExchangeUpdate();
              }
            },
          },
        ]);
      } else {
        throw new Error(data.message || 'Error al eliminar');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'No se pudo eliminar del historial', [{ text: 'OK', onPress: hideAlert }]);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
          <CustomAlert
            visible={alertVisible}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onClose={hideAlert}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="swap-horizontal-outline" size={28} color="#d500ff" />
              <Text style={styles.headerTitle}>Detalles del Intercambio</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Libros */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book" size={20} color="#d500ff" />
                <Text style={styles.sectionTitle}>Libros a Intercambiar</Text>
              </View>

              <View style={styles.booksRow}>
                {/* Libro Solicitado */}
                <View style={styles.bookColumn}>
                  <Text style={styles.bookLabel}>Libro Solicitado</Text>
                  <View style={styles.bookCardSmall}>
                    <Image
                      source={{
                        uri:
                          exchange.libro_solicitado.imagenes?.[0]?.url_imagen ||
                          'https://via.placeholder.com/50x75/333/fff',
                      }}
                      style={styles.bookImageSmall}
                    />
                    <View style={styles.bookInfoSmall}>
                      <Text style={styles.bookTitleSmall} numberOfLines={2}>
                        {exchange.libro_solicitado.titulo}
                      </Text>
                      <Text style={styles.bookAuthorSmall} numberOfLines={1}>
                        {exchange.libro_solicitado.autor}
                      </Text>
                      <Text style={styles.bookOwnerSmall}>
                        {exchange.libro_solicitado.propietario.nombre_usuario}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Icono de intercambio */}
                <View style={styles.exchangeIconWrapper}>
                  <Ionicons name="swap-horizontal" size={32} color="#d500ff" />
                </View>

                {/* Libro Ofertado */}
                <View style={styles.bookColumn}>
                  <Text style={styles.bookLabel}>Libro Ofrecido</Text>
                  {exchange.libro_ofertado ? (
                    <View style={styles.bookCardSmall}>
                      <Image
                        source={{
                          uri:
                            exchange.libro_ofertado.imagenes?.[0]?.url_imagen ||
                            'https://via.placeholder.com/50x75/333/fff',
                        }}
                        style={styles.bookImageSmall}
                      />
                      <View style={styles.bookInfoSmall}>
                        <Text style={styles.bookTitleSmall} numberOfLines={2}>
                          {exchange.libro_ofertado.titulo}
                        </Text>
                        <Text style={styles.bookAuthorSmall} numberOfLines={1}>
                          {exchange.libro_ofertado.autor}
                        </Text>
                        <Text style={styles.bookOwnerSmall}>
                          {exchange.libro_ofertado.propietario.nombre_usuario}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyBookCard}>
                      {canSelectBook ? (
                        <TouchableOpacity style={styles.selectButton} onPress={onSelectBook}>
                          <Ionicons name="add-circle-outline" size={24} color="#d500ff" />
                          <Text style={styles.selectButtonText}>Seleccionar</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.waitingContainer}>
                          <Ionicons name="time-outline" size={20} color="#666" />
                          <Text style={styles.waitingText}>Esperando...</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Ubicación */}
            {exchange.libro_ofertado && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location" size={20} color="#d500ff" />
                  <Text style={styles.sectionTitle}>Lugar de Encuentro</Text>
                  {hasLocation && (
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.statusBadgeText}>Configurado</Text>
                    </View>
                  )}
                </View>

                {hasLocation ? (
                  <View style={styles.locationCard}>
                    <View style={styles.locationIconWrapper}>
                      <Ionicons name="location" size={32} color="#d500ff" />
                    </View>
                    <View style={styles.locationContent}>
                      <Text style={styles.locationName}>{exchange.ubicacion_encuentro_nombre}</Text>
                      {exchange.ubicacion_encuentro_direccion && (
                        <Text style={styles.locationAddress} numberOfLines={3}>
                          {exchange.ubicacion_encuentro_direccion}
                        </Text>
                      )}
                    </View>
                    {canChangeLocation && (
                      <TouchableOpacity style={styles.editLocationBtn} onPress={navigateToMap}>
                        <Ionicons name="pencil" size={16} color="#d500ff" />
                        <Text style={styles.editLocationText}>Cambiar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <LinearGradient colors={['#6100BD', '#D500FF']} style={styles.selectLocationBtn}>
                    <TouchableOpacity style={styles.selectLocationBtnContent} onPress={navigateToMap}>
                      <Ionicons name="add-circle-outline" size={24} color="#fff" />
                      <Text style={styles.selectLocationText}>Seleccionar Lugar de Encuentro</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                )}
              </View>
            )}

            {/* Confirmación */}
            {exchange.libro_ofertado && hasLocation && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={bothConfirmed ? '#4CAF50' : '#d500ff'} />
                  <Text style={styles.sectionTitle}>Confirmación del Intercambio</Text>
                  {bothConfirmed && (
                    <View style={[styles.statusBadge, { backgroundColor: '#1B5E20' }]}>
                      <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
                      <Text style={styles.statusBadgeText}>Completado</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.confirmDescription}>
                  Ambos usuarios deben confirmar para completar el intercambio
                </Text>

                {/* Estado de confirmaciones */}
                <View style={styles.confirmStatesRow}>
                  <View
                    style={[
                      styles.confirmStateSmall,
                      exchange.confirmacion_solicitante && styles.confirmStateConfirmed,
                    ]}
                  >
                    <Ionicons
                      name={exchange.confirmacion_solicitante ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={exchange.confirmacion_solicitante ? '#4CAF50' : '#666'}
                    />
                    <View style={styles.confirmStateInfoSmall}>
                      <Text
                        style={[
                          styles.confirmStateNameSmall,
                          exchange.confirmacion_solicitante && styles.confirmedText,
                        ]}
                      >
                        {exchange.nombre_usuario_solicitante || 'Solicitante'}
                      </Text>
                      <Text style={styles.confirmStateStatusSmall}>
                        {exchange.confirmacion_solicitante ? 'Confirmado ✓' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.confirmStateSmall, exchange.confirmacion_receptor && styles.confirmStateConfirmed]}
                  >
                    <Ionicons
                      name={exchange.confirmacion_receptor ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={exchange.confirmacion_receptor ? '#4CAF50' : '#666'}
                    />
                    <View style={styles.confirmStateInfoSmall}>
                      <Text
                        style={[
                          styles.confirmStateNameSmall,
                          exchange.confirmacion_receptor && styles.confirmedText,
                        ]}
                      >
                        {exchange.nombre_usuario_receptor || 'Receptor'}
                      </Text>
                      <Text style={styles.confirmStateStatusSmall}>
                        {exchange.confirmacion_receptor ? 'Confirmado ✓' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Botón de confirmación */}
                {bothConfirmed ? (
                  <View>
                    <View style={styles.completedBanner}>
                      <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                      <Text style={styles.completedTitle}>¡Intercambio Confirmado!</Text>
                      <Text style={styles.completedSubtitle}>Ya pueden coordinar el encuentro</Text>
                    </View>
                    
                    {/* Botón de eliminar del historial */}
                    <TouchableOpacity
                      style={[styles.deleteHistoryButton, { marginTop: 16 }]}
                      onPress={handleDeleteFromHistory}
                      disabled={deleting}
                      activeOpacity={0.7}
                    >
                      {deleting ? (
                        <ActivityIndicator color="#ff4444" size="small" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={22} color="#ff4444" />
                          <Text style={styles.deleteHistoryButtonText}>Eliminar del Historial</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {/* Botón de calificar */}
                    {!checkingRating && !hasRated && (
                      <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() => setShowRatingModal(true)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={24} color="#FFD700" />
                        <Text style={styles.rateButtonText}>Calificar Usuario</Text>
                      </TouchableOpacity>
                    )}

                    {hasRated && (
                      <View style={styles.ratedBanner}>
                        <Ionicons name="star" size={24} color="#FFD700" />
                        <Text style={styles.ratedText}>Ya calificaste este intercambio</Text>
                      </View>
                    )}
                  </View>
                ) : !userConfirmed ? (
                  <TouchableOpacity
                    style={[styles.confirmBtn, (confirming || isPressed) && styles.confirmBtnPressed]}
                    onPressIn={() => setIsPressed(true)}
                    onPressOut={() => setIsPressed(false)}
                    onPress={handleConfirm}
                    disabled={confirming}
                    activeOpacity={1}
                  >
                    {confirming ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={28} color={(confirming || isPressed) ? "#fff" : "#4CAF50"} />
                        <Text style={[styles.confirmBtnText, (confirming || isPressed) && styles.confirmBtnTextPressed]}>
                          Aceptar y Confirmar
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingConfirmBanner}>
                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    <View style={styles.waitingConfirmContent}>
                      <Text style={styles.waitingConfirmTitle}>Ya confirmaste</Text>
                      <Text style={styles.waitingConfirmSubtitle}>
                        Esperando confirmación de {isSolicitante ? 'el receptor' : 'el solicitante'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Botón de cancelar intercambio */}
            {!bothConfirmed && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelExchange}
                  disabled={canceling}
                >
                  {canceling ? (
                    <ActivityIndicator color="#ff4444" size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={24} color="#ff4444" />
                      <Text style={styles.cancelButtonText}>Cancelar Intercambio</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        otherUserName={otherUserName}
        otherUserId={otherUserId}
        otherUserPhoto={otherUserPhoto}
        currentUserId={currentUserId || 0}
        exchangeId={exchange.id_intercambio}
        onRatingSubmitted={() => {
          setHasRated(true);
          setShowRatingModal(false);
          if (onExchangeUpdate) {
            onExchangeUpdate();
          }
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#151718',
    borderRadius: 20,
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B3A1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
  },
  // Libros lado a lado
  booksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bookColumn: {
    flex: 1,
  },
  bookLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  bookCardSmall: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bookImageSmall: {
    width: 45,
    height: 65,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  bookInfoSmall: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  bookTitleSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  bookAuthorSmall: {
    fontSize: 10,
    color: '#999',
    marginBottom: 3,
  },
  bookOwnerSmall: {
    fontSize: 10,
    color: '#d500ff',
    fontWeight: '600',
  },
  exchangeIconWrapper: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBookCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    minHeight: 81,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButton: {
    alignItems: 'center',
    gap: 6,
  },
  selectButtonText: {
    fontSize: 12,
    color: '#d500ff',
    fontWeight: '700',
    textAlign: 'center',
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 6,
  },
  waitingText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  // Ubicación
  locationCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#d500ff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A1A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  editLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A1A3A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d500ff',
  },
  editLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d500ff',
  },
  selectLocationBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectLocationBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  selectLocationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Confirmación
  confirmDescription: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  confirmStatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  confirmStateSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    gap: 8,
  },
  confirmStateConfirmed: {
    borderColor: '#4CAF50',
    backgroundColor: '#1B3A1E',
  },
  confirmStateInfoSmall: {
    flex: 1,
  },
  confirmStateNameSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    marginBottom: 2,
  },
  confirmedText: {
    color: '#4CAF50',
  },
  confirmStateStatusSmall: {
    fontSize: 11,
    color: '#666',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  confirmBtnPressed: {
    backgroundColor: '#2E7D32',
  },
  confirmBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
  },
  confirmBtnTextPressed: {
    color: '#fff',
  },
  completedBanner: {
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 12,
    marginBottom: 4,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#81C784',
    textAlign: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  ratedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A1A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#3A3A2A',
  },
  ratedText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  waitingConfirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 14,
  },
  waitingConfirmContent: {
    flex: 1,
  },
  waitingConfirmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  waitingConfirmSubtitle: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff4444',
  },
  deleteHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#ff4444',
    gap: 10,
  },
  deleteHistoryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff4444',
  },
});
