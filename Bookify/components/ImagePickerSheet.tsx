import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

const ImagePickerSheet: React.FC<ImagePickerSheetProps> = ({
  visible,
  onClose,
  onCamera,
  onGallery,
}) => {
  if (!visible) return null;

  const handleCameraPress = () => {
    console.log('[ImagePickerSheet] Camera pressed');
    onClose();
    // Llamar directamente sin setTimeout
    requestAnimationFrame(() => {
      console.log('[ImagePickerSheet] Calling onCamera');
      onCamera();
    });
  };

  const handleGalleryPress = () => {
    console.log('[ImagePickerSheet] Gallery pressed');
    onClose();
    // Llamar directamente sin setTimeout
    requestAnimationFrame(() => {
      console.log('[ImagePickerSheet] Calling onGallery');
      onGallery();
    });
  };

  return (
    <View style={styles.absoluteContainer}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header con línea de arrastre */}
          <View style={styles.dragIndicator} />
          
          <View style={styles.header}>
            <ThemedText style={styles.title}>Agregar foto</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.option}
              onPress={handleCameraPress}
              activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#4A90E2' }]}>
                <Ionicons name="camera" size={28} color="#fff" />
              </View>
              <View style={styles.optionText}>
                <ThemedText style={styles.optionTitle}>Cámara</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Toma una foto ahora
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.option}
              onPress={handleGalleryPress}
              activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#d500ff' }]}>
                <Ionicons name="images" size={28} color="#fff" />
              </View>
              <View style={styles.optionText}>
                <ThemedText style={styles.optionTitle}>Galería</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Elige de tus fotos
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Botón cancelar */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});

export default ImagePickerSheet;
