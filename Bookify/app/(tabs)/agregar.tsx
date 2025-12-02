import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LocationRequiredScreen from '@/components/LocationRequiredScreen';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { getGenreColor, getGenreColorLight } from '../../utils/genreColors';
import { useAuth } from '@/contexts/AuthContext';
import CustomAlert from '@/components/CustomAlert';
import { useAlertDialog } from '@/hooks/useAlertDialog';
import ImagePickerSheet from '@/components/ImagePickerSheet';
import PermissionModal from '@/components/PermissionModal';

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
  const { user, tokens } = useAuth(); 
  
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'gallery'>('camera');

  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    description: '',
  });
  
  const [bookImages, setBookImages] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Aqui se valida el tamano de las fotos
  const validateImageSize = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size > MAX_FILE_SIZE) {
        showAlert(
          'Imagen muy grande',
          `La imagen debe ser menor a 5MB. Tamaño actual: ${(blob.size / (1024 * 1024)).toFixed(2)}MB`,
          [{ text: 'OK', onPress: hideAlert }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating image size:', error);
      return true;
    }
  };


  const pickImage = async () => {
    console.log('[pickImage] Function called');
    if (bookImages.length >= MAX_IMAGES) {
      console.log('[pickImage] Max images reached');
      showAlert(
        'Límite alcanzado',
        `Solo puedes agregar hasta ${MAX_IMAGES} fotos por libro`,
        [{ text: 'OK', onPress: hideAlert }]
      );
      return;
    }

    try {
      console.log('[pickImage] Checking permissions...');
      const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('[pickImage] Permission status:', { status, canAskAgain });
      
      if (status !== 'granted') {
        if (canAskAgain) {
          console.log('[pickImage] Showing permission modal');
          setPermissionType('gallery');
          setPermissionModalVisible(true);
        } else {
          showAlert(
            'Permiso denegado',
            'Por favor habilita el acceso a la galería en la configuración de tu dispositivo para seleccionar fotos.',
            [{ text: 'OK', onPress: hideAlert }]
          );
        }
        return;
      }


      console.log('[pickImage] Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      console.log('[pickImage] Result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const isValid = await validateImageSize(result.assets[0].uri);
        if (isValid) {
          uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Error', 'Error al seleccionar imagen', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  
  const takePhoto = async () => {
    console.log('[takePhoto] Function called');
    if (bookImages.length >= MAX_IMAGES) {
      console.log('[takePhoto] Max images reached');
      showAlert(
        'Límite alcanzado',
        `Solo puedes agregar hasta ${MAX_IMAGES} fotos por libro`,
        [{ text: 'OK', onPress: hideAlert }]
      );
      return;
    }

    try {
      console.log('[takePhoto] Checking camera permissions...');
      const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
      console.log('[takePhoto] Permission status:', { status, canAskAgain });
      
      if (status !== 'granted') {
        if (canAskAgain) {
          console.log('[takePhoto] Showing permission modal');
          setPermissionType('camera');
          setPermissionModalVisible(true);
        } else {
          showAlert(
            'Permiso denegado',
            'Por favor habilita el acceso a la cámara en la configuración de tu dispositivo para tomar fotos.',
            [{ text: 'OK', onPress: hideAlert }]
          );
        }
        return;
      }

      console.log('[takePhoto] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      console.log('[takePhoto] Result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const isValid = await validateImageSize(result.assets[0].uri);
        if (isValid) {
          uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Error', 'Error al tomar foto', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  // Permisos
  const handlePermissionConfirm = async () => {
    console.log('[handlePermissionConfirm] Permission type:', permissionType);
    setPermissionModalVisible(false);

    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      if (permissionType === 'camera') {
        console.log('[handlePermissionConfirm] Requesting camera permission...');
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        console.log('[handlePermissionConfirm] Camera permission result:', permissionResult);
        
        if (permissionResult.granted) {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });

          if (!result.canceled && result.assets && result.assets[0]) {
            const isValid = await validateImageSize(result.assets[0].uri);
            if (isValid) {
              uploadImage(result.assets[0].uri);
            }
          }
        } else {
          showAlert(
            'Permiso denegado',
            'No se puede acceder a la cámara sin los permisos necesarios.',
            [{ text: 'OK', onPress: hideAlert }]
          );
        }
      } else {
        console.log('[handlePermissionConfirm] Requesting gallery permission...');
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[handlePermissionConfirm] Gallery permission result:', permissionResult);
        
        if (permissionResult.granted) {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });

          if (!result.canceled && result.assets && result.assets[0]) {
            const isValid = await validateImageSize(result.assets[0].uri);
            if (isValid) {
              uploadImage(result.assets[0].uri);
            }
          }
        } else {
          showAlert(
            'Permiso denegado',
            'No se puede acceder a la galería sin los permisos necesarios.',
            [{ text: 'OK', onPress: hideAlert }]
          );
        }
      }
    } catch (error) {
      console.error('[handlePermissionConfirm] Error:', error);
      showAlert('Error', 'Error al solicitar permisos', [
        { text: 'OK', onPress: hideAlert }
      ]);
    }
  };

  const handlePermissionCancel = () => {
    console.log('[handlePermissionCancel] User cancelled permission request');
    setPermissionModalVisible(false);
  };

  // Aqui se suben las imagenes al s3
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
      
      if (result.success && result.data.imageUrl) {
        setBookImages(prev => [...prev, result.data.imageUrl]);
        showAlert('Éxito', 'Imagen subida correctamente', [
          { text: 'OK', onPress: hideAlert }
        ]);
      } else {
        throw new Error(result.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('Error', 'No se pudo subir la imagen. Verifica tu conexión.', [
        { text: 'OK', onPress: hideAlert }
      ]);
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    if (bookImages.length >= MAX_IMAGES) {
      showAlert(
        'Límite alcanzado',
        `Solo puedes agregar hasta ${MAX_IMAGES} fotos por libro`,
        [{ text: 'OK', onPress: hideAlert }]
      );
      return;
    }

    setImagePickerVisible(true);
  };

  // Eliminar imagenes
  const removeImage = (index: number) => {
    showAlert(
      'Eliminar foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: hideAlert
        },
        {
          text: 'Eliminar',
          onPress: () => {
            setBookImages(prev => prev.filter((_, i) => i !== index));
            if (coverImageIndex === index) {
              setCoverImageIndex(0);
            } else if (coverImageIndex > index) {
              setCoverImageIndex(prev => prev - 1);
            }
            hideAlert();
          }
        }
      ]
    );
  };

  const setAsCoverImage = (index: number) => {
    setCoverImageIndex(index);
    showAlert(
      'Portada seleccionada',
      'Esta foto se mostrará como portada del libro',
      [{ text: 'OK', onPress: hideAlert }]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const saveBook = async () => {
    if (!bookData.title || !bookData.author) {
      showAlert('Error', 'Por favor completa los campos obligatorios: Título y Autor', [
        { text: 'Entendido', onPress: hideAlert }
      ]);
      return;
    }

    if (selectedGenres.length === 0) {
      showAlert('Error', 'Por favor selecciona al menos un género', [
        { text: 'Entendido', onPress: hideAlert }
      ]);
      return;
    }

    if (!user || !user.id_usuario || !tokens?.accessToken) {
      showAlert('Error', 'Debes iniciar sesión para agregar libros', [
        { text: 'OK', onPress: hideAlert }
      ]);
      console.error('[DEBUG] Usuario no autenticado:', user);
      return;
    }
    
    setSaving(true);

    try {
      const bookToSave = {
        titulo: bookData.title,
        autor: bookData.author,
        descripcion: bookData.description,
        generos: selectedGenres, 
        imagenes: bookImages,
        id_usuario: user.id_usuario,
      };

      console.log('[DEBUG] Libro a guardar:', bookToSave);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(bookToSave),
      });

      const result = await response.json();
      
      if (response.ok) {
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
      showAlert('Error', `No se pudo guardar el libro: ${error instanceof Error ? error.message : 'Error desconocido'}`, [
        { text: 'OK', onPress: hideAlert }
      ]);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBookData({
      title: '',
      author: '',
      description: '',
    });
    setBookImages([]);
    setCoverImageIndex(0);
    setSelectedGenres([]);
  };

  return (
    <LocationRequiredScreen>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Agregar Libro</ThemedText>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={saveBook}
                style={styles.saveButton}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Seccion de fotos */}
          <View style={styles.photoSection}>
            {/* Preview de la portada */}
            {bookImages.length > 0 && (
              <View style={styles.coverPreviewContainer}>
                <ThemedText style={styles.coverPreviewLabel}>
                  Portada seleccionada
                </ThemedText>
                <View style={styles.coverPreview}>
                  <Image 
                    source={{ uri: bookImages[coverImageIndex] }}
                    style={styles.coverPreviewImage}
                  />
                  <View style={styles.coverBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.coverBadgeText}>Principal</ThemedText>
                  </View>
                </View>
              </View>
            )}

            {/* Carrusel de fotos */}
            {bookImages.length > 0 && (
              <View style={styles.carouselContainer}>
                <ThemedText style={styles.carouselLabel}>
                  Fotos ({bookImages.length}/{MAX_IMAGES})
                </ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.carousel}
                >
                  {bookImages.map((imageUrl, index) => (
                    <View key={index} style={styles.carouselImageContainer}>
                      <Image 
                        source={{ uri: imageUrl }}
                        style={styles.carouselImage}
                      />
                      
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={28} color="#ff3b30" />
                      </TouchableOpacity>

                      
                      {coverImageIndex === index ? (
                        <View style={styles.coverIndicator}>
                          <Ionicons name="star" size={20} color="#FFD700" />
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.setCoverButton}
                          onPress={() => setAsCoverImage(index)}
                        >
                          <Ionicons name="star-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  
                  {/* Boton para agregar mas fotos */}
                  {bookImages.length < MAX_IMAGES && (
                    <TouchableOpacity 
                      style={styles.addMoreButton}
                      onPress={showImageOptions}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#d500ff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="add-circle-outline" size={32} color="#d500ff" />
                          <ThemedText style={styles.addMoreText}>Agregar</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}

           
            {bookImages.length === 0 && (
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={showImageOptions}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#d500ff" size="large" />
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#666" />
                    <ThemedText style={styles.addPhotoText}>Agregar fotos</ThemedText>
                    <ThemedText style={styles.addPhotoSubtext}>
                      Máximo {MAX_IMAGES} fotos (hasta 5MB cada una)
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Formulario del libro*/}
            
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
        </ScrollView>
        
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
        
        
        <ImagePickerSheet
          visible={imagePickerVisible}
          onClose={() => setImagePickerVisible(false)}
          onCamera={takePhoto}
          onGallery={pickImage}
        />

        
        <PermissionModal
          visible={permissionModalVisible}
          onClose={handlePermissionCancel}
          onConfirm={handlePermissionConfirm}
          permissionType={permissionType}
        />
        </SafeAreaView>
      </ThemedView>
    </LocationRequiredScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
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
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
  addPhotoSubtext: {
    color: '#555',
    marginTop: 5,
    fontSize: 12,
    fontWeight: '400',
  },
  coverPreviewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  coverPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coverBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carouselLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
  },
  carousel: {
    flexDirection: 'row',
  },
  carouselImageContainer: {
    width: 120,
    height: 150,
    marginRight: 12,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIndicator: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setCoverButton: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreButton: {
    width: 120,
    height: 150,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreText: {
    color: '#d500ff',
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
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
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  genreText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
});