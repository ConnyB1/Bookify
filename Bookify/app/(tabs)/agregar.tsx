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
  // Alert, // <-- Quitamos la nativa
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { getGenreColor, getGenreColorLight } from '../../utils/genreColors';
import { useAuth } from '@/contexts/AuthContext';
// 1. Importar el hook y el componente de alerta
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';

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
  const { user, tokens } = useAuth(); // Añadir tokens
  
  // 2. Instanciar el hook
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  // Estados para el formulario de agregar libro
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    description: '',
  });
  
  const [bookImages, setBookImages] = useState<string[]>([]); // Almacena URLs de S3
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false); // Spinner para subida de imagen
  const [saving, setSaving] = useState(false); // Spinner para guardado final

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        // 3. Reemplazar Alert.alert
        showAlert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar imágenes', [
          { text: 'OK', onPress: hideAlert }
        ]);
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
      showAlert('Error', 'Error al seleccionar imagen', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  // Función para tomar foto
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        // 3. Reemplazar Alert.alert
        showAlert('Permiso necesario', 'Se necesita acceso a la cámara para tomar fotos', [
          { text: 'OK', onPress: hideAlert }
        ]);
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
      showAlert('Error', 'Error al tomar foto', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  // Función para subir imagen al backend (S3)
  const uploadImage = async (imageUri: string) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'book-image.jpg',
      } as any);

      // Usar el endpoint singular UPLOAD_IMAGE
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_IMAGE), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.success && result.data.imageUrl) {
        setBookImages(prev => [...prev, result.data.imageUrl]);
        // 3. Reemplazar Alert.alert
        showAlert('Éxito', 'Imagen subida correctamente', [
          { text: 'OK', onPress: hideAlert }
        ]);
      } else {
        throw new Error(result.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // 3. Reemplazar Alert.alert
      showAlert('Error', 'No se pudo subir la imagen. Verifica tu conexión.', [
        { text: 'OK', onPress: hideAlert }
      ]);
    } finally {
      setUploading(false);
    }
  };

  // Función para mostrar opciones de imagen
  const showImageOptions = () => {
    // 3. Reemplazar Alert.alert con showAlert (la que pediste)
    showAlert(
      'Agregar foto',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: () => { hideAlert(); takePhoto(); } },
        { text: 'Galería', onPress: () => { hideAlert(); pickImage(); } },
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
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
      // 3. Reemplazar Alert.alert
      showAlert('Error', 'Por favor completa los campos obligatorios: Título y Autor', [
        { text: 'Entendido', onPress: hideAlert }
      ]);
      return;
    }

    if (selectedGenres.length === 0) {
      // 3. Reemplazar Alert.alert
      showAlert('Error', 'Por favor selecciona al menos un género', [
        { text: 'Entendido', onPress: hideAlert }
      ]);
      return;
    }

    // Validar que el usuario esté autenticado
    if (!user || !user.id_usuario || !tokens?.accessToken) {
      // 3. Reemplazar Alert.alert
      showAlert('Error', 'Debes iniciar sesión para agregar libros', [
        { text: 'OK', onPress: hideAlert }
      ]);
      console.error('[DEBUG] Usuario no autenticado:', user);
      return;
    }
    
    setSaving(true); // Activar spinner de guardado

    try {
      // Preparar datos del libro para enviar al backend
      const bookToSave = {
        titulo: bookData.title,
        autor: bookData.author,
        descripcion: bookData.description,
        // Tu backend espera un array de strings para géneros
        generos: selectedGenres, 
        // Tu backend espera un array de strings (URLs) para imágenes
        urls_imagenes: bookImages, 
        id_propietario: user.id_usuario, 
        estado: 'available', // Añadir estado por defecto
      };

      console.log('[DEBUG] Libro a guardar:', bookToSave);
      
      // Llamada al endpoint del backend para guardar en DB
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`, // Añadir token de Auth
        },
        body: JSON.stringify(bookToSave),
      });

      const result = await response.json();
      
      if (response.ok) { // Chequear response.ok en lugar de result.success
        // 3. Reemplazar Alert.alert
        showAlert('Éxito', 'Libro agregado correctamente', [
          { text: 'OK', onPress: () => {
            hideAlert();
            resetForm();
          }}
        ]);
      } else {
        throw new Error(result.message || 'Error al guardar el libro');
      }
      
    } catch (error) {
      console.error('Error saving book:', error);
      // 3. Reemplazar Alert.alert
      showAlert('Error', `No se pudo guardar el libro: ${error instanceof Error ? error.message : 'Error desconocido'}`, [
        { text: 'OK', onPress: hideAlert }
      ]);
    } finally {
      setSaving(false); // Desactivar spinner de guardado
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
              disabled={saving} // Deshabilitar mientras se guarda
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Sección de Fotos */}
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={styles.addPhotoButton}
              onPress={showImageOptions}
              disabled={uploading} // Deshabilitar mientras se sube
            >
              {uploading ? (
                <ActivityIndicator color="#d500ff" size="large" />
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
        
        {/* 4. Añadir el componente CustomAlert al final */}
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

// Estilos de tu código original
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
    minWidth: 80, // Ancho mínimo
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    // No necesita flex: 1 si el contenedor principal ya lo tiene
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
    // marginTop: 10, // Quitado, ya que addPhotoButton tiene marginBottom
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
    gap: 10, // 'gap' es más simple que marginBottom
    // paddingBottom: 20, // Quitado, el form ya tiene paddingBottom
  },
  genreButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    // marginBottom: 8, // Quitado, 'gap' lo maneja
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