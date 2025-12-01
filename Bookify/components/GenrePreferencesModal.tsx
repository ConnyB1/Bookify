import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { API_CONFIG, buildApiUrl } from '../config/api';

interface Genre {
  id_genero: number;
  nombre: string;
}

interface GenrePreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedGenres: number[]) => void;
  initialSelectedGenres: number[];
}

const GenrePreferencesModal: React.FC<GenrePreferencesModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSelectedGenres,
}) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(initialSelectedGenres);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchGenres();
      setSelectedGenres(initialSelectedGenres);
    }
  }, [visible, initialSelectedGenres]);

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const url = buildApiUrl('/api/generos');
      console.log('[GenreModal] Fetching genres from:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('[GenreModal] Genres response:', result);
      
      if (result.success && result.data) {
        setGenres(result.data);
      } else {
        console.error('[GenreModal] Failed to fetch genres:', result.message);
        setGenres([]);
      }
    } catch (error) {
      console.error('[GenreModal] Error fetching genres:', error);
      setGenres([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedGenres);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Géneros Favoritos</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.subtitle}>
            Selecciona los géneros que te interesan
          </ThemedText>

          {loading ? (
            <ActivityIndicator size="large" color="#d500ff" style={styles.loader} />
          ) : (
            <FlatList
              data={genres}
              keyExtractor={(item) => item.id_genero.toString()}
              numColumns={2}
              contentContainerStyle={styles.genreList}
              renderItem={({ item }) => {
                const isSelected = selectedGenres.includes(item.id_genero);
                return (
                  <TouchableOpacity
                    style={[
                      styles.genreChip,
                      isSelected && styles.genreChipSelected,
                    ]}
                    onPress={() => toggleGenre(item.id_genero)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        isSelected && styles.genreTextSelected,
                      ]}
                    >
                      {item.nombre}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#fff"
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              {selectedGenres.length} género{selectedGenres.length !== 1 ? 's' : ''} seleccionado{selectedGenres.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                selectedGenres.length === 0 && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={selectedGenres.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Guardar Preferencias</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  loader: {
    marginVertical: 40,
  },
  genreList: {
    padding: 16,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 6,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
  genreChipSelected: {
    backgroundColor: '#d500ff',
    borderColor: '#d500ff',
  },
  genreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  genreTextSelected: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  selectedCount: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#d500ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GenrePreferencesModal;
