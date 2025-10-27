import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG, buildApiUrl } from '../../config/api';

// Interfaces necesarias para el DTO (deberían estar en config/api.ts)
interface ImagenDTO { url_imagen: string; }
interface GeneroDTO { nombre: string; }
interface PropietarioDTO { nombre_usuario: string; }

interface LibroDTO {
  id_libro: number;
  titulo: string;
  autor: string;
  descripcion?: string;
  estado: string;
  propietario: PropietarioDTO;
  generos?: GeneroDTO[];
  imagenes?: ImagenDTO[];
}

const { width } = Dimensions.get('window');

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams();
  const [libro, setLibro] = useState<LibroDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  const bookId = typeof id === 'string' ? parseInt(id, 10) : undefined;
  
  useEffect(() => {
    if (bookId) {
      fetchBookDetails(bookId);
    } else {
      setLoading(false);
    }
  }, [bookId]);

  const fetchBookDetails = async (id: number) => {
    setLoading(true);
    try {
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.BOOKS}/${id}`);
      const response = await fetch(url);
      
      // 🛑 FIX CRÍTICO: Manejar errores del backend y respuesta sin envelope 🛑
      if (response.status === 400) {
        // Manejar el BadRequestException (Libro no encontrado)
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Libro no encontrado.'); 
      }
      
      if (!response.ok) {
        throw new Error(`Error de red: ${response.statusText}`);
      }
      
      // El resultado es directamente el objeto del libro
      const result = await response.json(); 
      
      // Verificar si el resultado es un objeto Libro válido
      if (result && result.id_libro) {
        setLibro(result);
      } else {
        throw new Error('Respuesta del servidor inválida o libro no encontrado.');
      }
      
    } catch (error) {
      console.error('Error fetching book details:', error);
      Alert.alert('Error', `No se pudo cargar el detalle del libro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#d500ff" />
        <ThemedText>Cargando detalles...</ThemedText>
      </ThemedView>
    );
  }

  if (!libro) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>No se encontró la información del libro.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.container}>
          
          {/* Imágenes del Libro */}
          {libro.imagenes && libro.imagenes.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {libro.imagenes.map((img, index) => (
                <Image 
                  key={index}
                  source={{ uri: img.url_imagen }} // Usar url_imagen como viene del backend
                  style={styles.bookImage}
                />
              ))}
            </ScrollView>
          )}

          <ThemedText style={styles.title}>{libro.titulo}</ThemedText>
          
          <ThemedText style={styles.label}>Autor:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.autor}</ThemedText>
          
          <ThemedText style={styles.label}>Propietario:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.propietario?.nombre_usuario || 'Anónimo'}</ThemedText>

          <ThemedText style={styles.label}>Estado:</ThemedText>
          <ThemedText style={styles.detailText}>{libro.estado.replace('_', ' ').toUpperCase()}</ThemedText>

          <ThemedText style={styles.label}>Descripción:</ThemedText>
          <ThemedText style={styles.descriptionText}>
            {libro.descripcion || 'Este libro no tiene una descripción detallada.'}
          </ThemedText>
          
          <ThemedText style={styles.label}>Géneros:</ThemedText>
          <ThemedText style={styles.detailText}>
            {libro.generos?.map(g => g.nombre).join(', ') || 'Sin géneros asignados.'}
          </ThemedText>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#151718' 
  },
  container: { 
    padding: 20 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#151718'
  },
  errorText: { 
    color: 'red', 
    marginTop: 10 
  },
  scrollContent: { 
    paddingBottom: 50 
  },
  imagesContainer: { 
    marginBottom: 20, 
    paddingRight: 10,
  },
  bookImage: { 
    width: width * 0.8,
    height: width * 1.1, 
    marginRight: 10, 
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#2a2a2a',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: 'white' 
  },
  label: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 15, 
    marginBottom: 5,
    color: '#d500ff' 
  },
  detailText: { 
    fontSize: 16, 
    color: 'lightgray' 
  },
  descriptionText: { 
    fontSize: 16, 
    marginTop: 5, 
    color: 'lightgray', 
    lineHeight: 22 
  },
});