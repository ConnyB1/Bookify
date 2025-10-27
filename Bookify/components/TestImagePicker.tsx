import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function TestImagePicker() {
  const testImagePicker = async () => {
    try {
      console.log('Testing ImagePicker...');
      console.log('ImagePicker object:', ImagePicker);
      console.log('MediaTypeOptions:', ImagePicker.MediaTypeOptions);
      
      // Verificar permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permiso denegado');
        return;
      }

      // Intentar abrir galería
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('ImagePicker result:', result);
      
      if (!result.canceled) {
        Alert.alert('Éxito', 'Imagen seleccionada correctamente');
      }
    } catch (error) {
      console.error('Error en test:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: 'white', marginBottom: 20, textAlign: 'center' }}>
        Test ImagePicker
      </Text>
      <TouchableOpacity 
        onPress={testImagePicker}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 10 
        }}
      >
        <Text style={{ color: 'white' }}>Probar ImagePicker</Text>
      </TouchableOpacity>
    </View>
  );
}