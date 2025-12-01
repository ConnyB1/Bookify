import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { buildApiUrl } from '../../config/api';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  otherUserName: string;
  otherUserId: number;
  otherUserPhoto?: string;
  currentUserId: number;
  exchangeId: number;
  onRatingSubmitted?: () => void;
}

export function RatingModal({
  visible,
  onClose,
  otherUserName,
  otherUserId,
  otherUserPhoto,
  currentUserId,
  exchangeId,
  onRatingSubmitted,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl('/api/rating'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_intercambio: exchangeId,
          id_usuario_calificador: currentUserId,
          id_usuario_calificado: otherUserId,
          estrellas: rating,
          resena: review.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Calificación enviada exitosamente:', result.data);

        if (onRatingSubmitted) {
          onRatingSubmitted();
        }

        // Resetear y cerrar
        setRating(0);
        setReview('');
        onClose();
      } else {
        throw new Error(result.message || 'Error al enviar calificación');
      }
    } catch (error: any) {
      console.error('Error al enviar calificación:', error);
      alert(error.message || 'No se pudo enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(0);
      setReview('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <MaskedView
                maskElement={<Text style={styles.title}>Calificar Usuario</Text>}
              >
                <LinearGradient
                  colors={['#6100BD', '#D500FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.titleMask}
                >
                  <Text style={[styles.title, { opacity: 0 }]}>Calificar Usuario</Text>
                </LinearGradient>
              </MaskedView>
              <TouchableOpacity
                onPress={handleClose}
                disabled={submitting}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Usuario a calificar */}
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                {otherUserPhoto ? (
                  <Image source={{ uri: otherUserPhoto }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle" size={64} color="#d500ff" />
                )}
              </View>
              <Text style={styles.userName}>{otherUserName}</Text>
              <Text style={styles.userSubtext}>
                ¿Cómo fue tu experiencia con este usuario?
              </Text>
            </View>

            {/* Estrellas */}
            <View style={styles.starsSection}>
              <Text style={styles.label}>Calificación</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    disabled={submitting}
                    style={styles.starButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#FFD700' : '#666'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Muy mala'}
                  {rating === 2 && 'Mala'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Buena'}
                  {rating === 5 && 'Excelente'}
                </Text>
              )}
            </View>

            {/* Reseña opcional */}
            {/* <View style={styles.reviewSection}>
              <Text style={styles.label}>Comentario (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Comparte tu experiencia..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={review}
                onChangeText={setReview}
                editable={!submitting}
                maxLength={500}
              />
              <Text style={styles.charCount}>{review.length}/500</Text>
            </View> */}

            {/* Botones */}
            <View style={styles.buttonsSection}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              {(rating === 0 || submitting) ? (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    styles.submitButtonDisabled,
                  ]}
                  disabled={true}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Enviar</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <LinearGradient
                  colors={['#6100BD', '#D500FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.button, styles.submitButton]}
                >
                  <TouchableOpacity
                    style={styles.submitButtonContent}
                    onPress={handleSubmit}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Enviar</Text>
                  </TouchableOpacity>
                </LinearGradient>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleMask: {
    height: 30,
  },
  closeButton: {
    padding: 4,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  userSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  starsSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#d500ff',
    textAlign: 'center',
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  buttonsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ccc',
  },
  submitButton: {
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  submitButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
