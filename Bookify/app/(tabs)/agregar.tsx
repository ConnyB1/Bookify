import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { getGenreColor, getGenreColorLight } from '../../utils/genreColors';
import { useAuth } from '@/contexts/AuthContext';

const GENRES = [
  'Ciencia Ficción',
  'Misterio',
  'Fantasía',
  'Romance',
  'Terror',
  'Biografía',
  'Historia',
  'Aventura',
];

export default function AgregarScreen() {
  const { user } = useAuth();
  
  // Estados para el formulario de agregar libro
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    description: '',
  });
  
  const [bookImages, setBookImages] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar imágenes');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error al seleccionar imagen');
    }
  };

  // Función para tomar foto
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la cámara para tomar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Error al tomar foto');
    }
  };

  // Función para subir imagen al backend
  const uploadImage = async (imageUri: string) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'book-image.jpg',
      } as any);

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_IMAGE), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setBookImages(prev => [...prev, result.data.imageUrl]);
        Alert.alert('Éxito', 'Imagen subida correctamente');
      } else {
        throw new Error(result.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Verifica tu conexión.');
    } finally {
      setUploading(false);
    }
  };

  // Función para mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      'Agregar foto',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Función para alternar géneros
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  // Función para guardar libro en la base de datos
  const saveBook = async () => {
    if (!bookData.title || !bookData.author) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios: Título y Autor');
      return;
    }

    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos un género');
      return;
    }

    // Validar que el usuario esté autenticado
    if (!user || !user.id_usuario) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar libros');
      console.error('[DEBUG] Usuario no autenticado:', user);
      return;
    }

    try {
      // Preparar datos del libro para enviar al backend
      const bookToSave = {
        titulo: bookData.title,
        autor: bookData.author,
        descripcion: bookData.description,
        generos: selectedGenres,
        imagenes: bookImages,
        id_usuario: user.id_usuario, // Usuario autenticado (ya validado arriba)
      };

      console.log('[DEBUG] Usuario actual:', user);
      console.log('[DEBUG] Libro a guardar:', bookToSave);
      
      // Llamada al endpoint del backend para guardar en DB
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bookToSave),
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Éxito', 'Libro agregado correctamente a la base de datos', [
          { text: 'OK', onPress: resetForm }
        ]);
      } else {
        throw new Error(result.message || 'Error al guardar el libro');
      }
      
    } catch (error) {
      console.error('Error saving book:', error);
      Alert.alert('Error', `No se pudo guardar el libro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const resetForm = () => {
    setBookData({
      title: '',
      author: '',
      description: '',
    });
    setBookImages([]);
    setSelectedGenres([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Agregar Libro</ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={saveBook}
              style={styles.saveButton}
            >
              <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Sección de Fotos */}
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={styles.addPhotoButton}
              onPress={showImageOptions}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" size="large" />
              ) : (
                <>
                  <Ionicons name="camera" size={40} color="#666" />
                  <ThemedText style={styles.addPhotoText}>Agregar fotos</ThemedText>
                </>
              )}
            </TouchableOpacity>
            
            {bookImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {bookImages.map((imageUrl, index) => (
                  <Image 
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.bookImage}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Título */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Título</ThemedText>
              <TextInput
                style={styles.input}
                value={bookData.title}
                onChangeText={(text) => setBookData(prev => ({ ...prev, title: text }))}
                placeholder="Título del libro"
                placeholderTextColor="#666"
              />
            </View>

            {/* Autor */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Autor</ThemedText>
              <TextInput
                style={styles.input}
                value={bookData.author}
                onChangeText={(text) => setBookData(prev => ({ ...prev, author: text }))}
                placeholder="Nombre del autor"
                placeholderTextColor="#666"
              />
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Descripción</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bookData.description}
                onChangeText={(text) => setBookData(prev => ({ ...prev, description: text }))}
                placeholder="Describe el libro..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Géneros */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Géneros</ThemedText>
              <View style={styles.genresContainer}>
                {GENRES.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreButton,
                      selectedGenres.includes(genre) && {
                        backgroundColor: getGenreColor(genre),
                        borderColor: getGenreColor(genre),
                      }
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <ThemedText 
                      style={[
                        styles.genreText,
                        selectedGenres.includes(genre) && {
                          color: 'white',
                          fontWeight: 'bold',
                        }
                      ]}
                    >
                      {genre}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#d500ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
  },

  // Photo Section
  photoSection: {
    marginBottom: 30,
  },
  addPhotoButton: {
    backgroundColor: '#2a2a2a',
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  addPhotoText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  imagesContainer: {
    marginTop: 10,
  },
  bookImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },

  // Form Styles
  form: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ccc',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    backgroundColor: '#2a2a2a',
    height: 50,
  },

  // Genres
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 20,
  },
  genreButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  genreButtonActive: {
    backgroundColor: '#d500ff',
    borderColor: '#d500ff',
  },
  genreText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  genreTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});