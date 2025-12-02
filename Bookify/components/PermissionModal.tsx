import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  permissionType: 'camera' | 'gallery';
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  permissionType,
}) => {
  const getPermissionInfo = () => {
    if (permissionType === 'camera') {
      return {
        icon: 'camera' as keyof typeof Ionicons.glyphMap,
        iconColor: '#4A90E2',
        title: 'Permiso de Cámara',
        message: 'Bookify necesita acceso a tu cámara para tomar fotos de tus libros y agregarlas a tu perfil.',
      };
    } else {
      return {
        icon: 'images' as keyof typeof Ionicons.glyphMap,
        iconColor: '#d500ff',
        title: 'Permiso de Galería',
        message: 'Bookify necesita acceso a tu galería para que puedas seleccionar fotos de tus libros.',
      };
    }
  };

  const { icon, iconColor, title, message } = getPermissionInfo();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Icono */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
            <Ionicons name={icon} size={48} color="#fff" />
          </View>

          {/* Título */}
          <ThemedText style={styles.title}>{title}</ThemedText>

          {/* Mensaje */}
          <ThemedText style={styles.message}>{message}</ThemedText>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}>
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              activeOpacity={0.7}>
              <ThemedText style={styles.confirmButtonText}>Permitir</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#d500ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PermissionModal;
