import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG, buildApiUrl } from '@/config/api';

interface UseProfileImageOptions {
  userId: number | undefined;
  tokens: { accessToken: string } | null;
  initialImageUrl: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  updateUser?: (user: any) => void;
}

export function useProfileImage({
  userId,
  tokens,
  initialImageUrl,
  onSuccess,
  onError,
  updateUser,
}: UseProfileImageOptions) {
  const [profilePictureUri, setProfilePictureUri] = useState<string>(initialImageUrl);
  const [isUploading, setIsUploading] = useState(false);

  const selectImageFrom = useCallback(async (source: 'gallery' | 'camera') => {
    let result;
    try {
      console.log(`[Profile] Launching ${source}...`);
      if (source === 'gallery') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      console.log(`[Profile] Result:`, result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setProfilePictureUri(selectedUri);
        await uploadAndSaveProfilePicture(selectedUri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      if (onError) {
        onError('No se pudo seleccionar la imagen.');
      }
    }
  }, []);

  const uploadAndSaveProfilePicture = async (uri: string) => {
    if (!userId || !tokens || !tokens.accessToken) {
      if (onError) {
        onError('No se pudo identificar al usuario para subir la foto.');
      }
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: `profile-${userId}-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    let newPhotoUrl = '';

    try {
      const uploadUrl = buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_PROFILE_IMAGE);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo a S3');
      }

      const result = await response.json();
      if (!result.success || !result.data || !result.data.imageUrl) {
        throw new Error(
          result.message || 'El servidor no devolvió una URL de imagen',
        );
      }
      newPhotoUrl = result.data.imageUrl;
    } catch (error) {
      console.error('Error en Paso 1 (Subida a S3):', error);
      if (onError) {
        onError(
          `No se pudo subir la foto: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }`
        );
      }
      setProfilePictureUri(initialImageUrl);
      setIsUploading(false);
      return;
    }

    try {
      const saveUrl = `${buildApiUrl(
        API_CONFIG.ENDPOINTS.UPDATE_PROFILE_PICTURE,
      )}/${userId}`;

      const response = await fetch(saveUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ photoUrl: newPhotoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al guardar la URL en el perfil',
        );
      }
      const result = await response.json();
      if (updateUser && result.success && result.data.user) {
        updateUser(result.data.user);
      }
      if (onSuccess) {
        onSuccess('Foto de perfil actualizada correctamente.');
      }
    } catch (error) {
      console.error('Error en Paso 2 (Guardar URL):', error);
      if (onError) {
        onError(
          `No se pudo guardar la foto en tu perfil: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }`
        );
      }
      setProfilePictureUri(initialImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGallerySelect = async () => {
    console.log('[Profile] Gallery selected');
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (onError) {
          onError('Necesitamos permiso para acceder a tu galería de fotos.');
        }
        return;
      }
    }
    selectImageFrom('gallery');
  };

  const handleCameraSelect = async () => {
    console.log('[Profile] Camera selected');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (onError) {
        onError('Necesitamos permiso para acceder a tu cámara.');
      }
      return;
    }
    selectImageFrom('camera');
  };

  return {
    profilePictureUri,
    isUploading,
    handleGallerySelect,
    handleCameraSelect,
    setProfilePictureUri,
  };
}
