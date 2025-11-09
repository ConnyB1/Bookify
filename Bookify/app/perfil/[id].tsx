import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { API_CONFIG, buildApiUrl } from '@/config/api';

// --- Definiciones de DTO ---
interface ImagenDTO {
  url_imagen: string;
}
interface LibroDTO {
  id_libro: number;
  titulo: string;
  imagenes?: ImagenDTO[];
}

interface UsuarioDTO {
  id_usuario: number;
  nombre_usuario: string;
  correo_electronico?: string;
  email?: string;
  foto_perfil_url?: string;
  libros?: LibroDTO[];
}
// --- Fin de DTO ---

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id ? parseInt(id, 10) : 0;

  const [user, setUser] = useState<UsuarioDTO | null>(null);
  const [libros, setLibros] = useState<LibroDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLibros, setLoadingLibros] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      fetchLibros();
    } else {
      setLoading(false);
      setLoadingLibros(false);
    }
  }, [userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}`));

      if (!response.ok) {
        throw new Error('Error al cargar perfil');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLibros = useCallback(async () => {
    if (!userId) {
      setLoadingLibros(false);
      return;
    }

    if (!refreshing) {
      setLoadingLibros(true);
    }

    try {
      const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.BOOKS)}/user/${userId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('No se pudieron cargar los libros');
      }

      const result = await response.json();

      if (result && Array.isArray(result)) {
        setLibros(result);
      } else {
        setLibros([]);
      }
    } catch (error) {
      console.error('Error al cargar libros del usuario:', error);
    } finally {
      setLoadingLibros(false);
    }
  }, [userId, refreshing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadUserProfile(), fetchLibros()]);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const handleBookPress = (bookId: number) => {
    router.push(`/(tabs)/libro/${bookId}`);
  };

  const renderListHeader = () => (
    <>
      {/* Perfil Card */}
      <View style={styles.profileCard}>
        <View>
          <Image
            source={{
              uri:
                user?.foto_perfil_url ||
                'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            }}
            style={styles.avatar}
          />
        </View>
        <ThemedText style={styles.userName}>
          {user?.nombre_usuario || 'Usuario'}
        </ThemedText>
        <ThemedText style={styles.userEmail}>
          {user?.correo_electronico || user?.email || ''}
        </ThemedText>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Ionicons name="star" size={18} color="#FFD700" />
          <Ionicons name="star" size={18} color="#FFD700" />
          <Ionicons name="star" size={18} color="#FFD700" />
          <Ionicons name="star-outline" size={18} color="#FFD700" />
          <ThemedText style={styles.ratingText}>4.0</ThemedText>
        </View>
      </View>

      {/* Título de la sección de libros */}
      <Text style={styles.sectionTitle}>Libros de {user?.nombre_usuario}</Text>
    </>
  );

  const renderEmptyList = () => {
    if (loadingLibros && !refreshing) {
      return (
        <ActivityIndicator
          size="large"
          color="#d500ff"
          style={{ marginTop: 20 }}
        />
      );
    }
    if (!loadingLibros && libros.length === 0) {
      return (
        <Text style={styles.noBooksText}>
          Este usuario no tiene libros registrados 📚
        </Text>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonHeader}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Perfil</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d500ff" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonHeader}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Perfil</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#666" />
          <Text style={styles.emptyTitle}>Usuario no encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header personalizado */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonHeader}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{user.nombre_usuario}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* LISTA SCROLLABLE */}
        <FlatList
          data={libros}
          keyExtractor={(item) => item.id_libro.toString()}
          numColumns={2}
          contentContainerStyle={styles.bookList}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#d500ff']}
              tintColor={'#d500ff'}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookCard}
              activeOpacity={0.7}
              onPress={() => handleBookPress(item.id_libro)}
            >
              <Image
                source={{
                  uri:
                    item.imagenes?.[0]?.url_imagen ||
                    'https://cdn-icons-png.flaticon.com/512/29/29302.png',
                }}
                style={styles.bookImage}
              />
              <Text style={styles.bookTitle} numberOfLines={1}>
                {item.titulo}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { 
    flex: 1, 
    paddingHorizontal: 20,
    backgroundColor: '#151718',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#151718',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButtonHeader: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#8b00ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginVertical: 12,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  userEmail: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 3,
  },
  ratingText: { color: '#fff', marginLeft: 5, fontSize: 14 },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 10,
  },
  noBooksText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  bookList: {
    paddingBottom: 100,
  },
  bookCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignItems: 'center',
    margin: 8,
    padding: 10,
    flex: 1,
    maxWidth: '48%',
  },
  bookImage: { width: 100, height: 140, borderRadius: 8, marginBottom: 8 },
  bookTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
