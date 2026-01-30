import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { getGenreColor } from '../../utils/genreColors';

interface GenreSelectorModalProps {
  visible: boolean;
  genres: string[];
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  onClose: () => void;
}

const GenreSelectorModal: React.FC<GenreSelectorModalProps> = ({
  visible,
  genres,
  selectedGenres,
  onGenreToggle,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Filtrar por Género</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Selected count */}
          {selectedGenres.length > 0 && (
            <View style={styles.selectedInfo}>
              <ThemedText style={styles.selectedText}>
                {selectedGenres.length} género{selectedGenres.length > 1 ? 's' : ''} seleccionado{selectedGenres.length > 1 ? 's' : ''}
              </ThemedText>
            </View>
          )}

          {/* Genres Grid */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.genresContainer}
          >
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreButton,
                    isSelected && {
                      backgroundColor: getGenreColor(genre),
                      borderColor: getGenreColor(genre),
                    }
                  ]}
                  onPress={() => onGenreToggle(genre)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color="#fff" 
                      style={styles.checkIcon}
                    />
                  )}
                  <ThemedText 
                    style={[
                      styles.genreText,
                      isSelected && styles.genreTextSelected
                    ]}
                  >
                    {genre}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer with action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                selectedGenres.forEach(genre => onGenreToggle(genre));
              }}
            >
              <ThemedText style={styles.clearButtonText}>Limpiar filtros</ThemedText>
            </TouchableOpacity>
            <LinearGradient
              colors={['#6100BD', '#D500FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyButton}
            >
              <TouchableOpacity 
                style={styles.applyButtonContent}
                onPress={onClose}
              >
                <ThemedText style={styles.applyButtonText}>Aplicar</ThemedText>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  selectedInfo: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedText: {
    color: '#d500ff',
    fontSize: 14,
    fontWeight: '600',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  genreButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkIcon: {
    marginRight: 2,
  },
  genreText: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '500',
  },
  genreTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  clearButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonContent: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GenreSelectorModal;
