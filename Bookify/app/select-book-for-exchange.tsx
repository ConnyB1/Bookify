import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookSelection } from '../hooks/exchange/useBookSelection';
import GenreChip from '../components/Bookify-componentes/GenreChip';
import CustomAlert from '../components/CustomAlert';
import { useAlertDialog } from '../hooks/useAlertDialog';
import { buildApiUrl } from '../config/api';

export default function SelectBookForExchangeScreen() {
  const router = useRouter();
  const { chatId, exchangeId, otherUserId } = useLocalSearchParams<{
    chatId: string;
    exchangeId: string;
    otherUserId: string;
  }>();

  const [hasOfferedBook, setHasOfferedBook] = React.useState(false);
  const [checkingExchange, setCheckingExchange] = React.useState(true);

  const { books, loading, selecting, selectBook } = useBookSelection(
    exchangeId, 
    otherUserId,
    () => {
      showAlert(
        'Éxito',
        'Libro ofrecido correctamente',
        [
          { 
            text: 'OK', 
            style: 'default', 
            onPress: () => {
              hideAlert();
              router.back();
            }
          }
        ]
      );
    },
    // onError
    (message: string) => {
      showAlert(
        'Error',
        message,
        [
          { 
            text: 'OK', 
            style: 'cancel', 
            onPress: hideAlert
          }
        ]
      );
    }
  );
  const { alertVisible, alertConfig, showAlert, hideAlert } = useAlertDialog();

  // Verificar si el intercambio ya tiene un libro ofrecido
  React.useEffect(() => {
    const checkExchangeStatus = async () => {
      try {
        setCheckingExchange(true);
        const url = buildApiUrl(`/api/exchange/${exchangeId}`);
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Si ya tiene un libro ofrecido, mostrar mensaje y volver
          if (result.data.id_libro_ofertado) {
            setHasOfferedBook(true);
            showAlert(
              'Libro Ya Seleccionado',
              'Ya has seleccionado un libro para este intercambio. No puedes cambiarlo una vez seleccionado.',
              [
                { 
                  text: 'Entendido', 
                  style: 'default', 
                  onPress: () => {
                    hideAlert();
                    router.back();
                  }
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error verificando estado del intercambio:', error);
      } finally {
        setCheckingExchange(false);
      }
    };

    if (exchangeId) {
      checkExchangeStatus();
    }
  }, [exchangeId]);

  // Debug: ver estructura de los géneros
  React.useEffect(() => {
    if (books.length > 0 && books[0].generos) {
      console.log('Estructura de géneros:', JSON.stringify(books[0].generos, null, 2));
    }
  }, [books]);

  const handleSelectBook = (bookId: number) => {
    showAlert(
      'Confirmar selección',
      '¿Deseas ofrecer este libro para el intercambio?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: hideAlert },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            hideAlert();
            await selectBook(bookId);
          },
        },
      ]
    );
  };

  if (loading || checkingExchange) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Seleccionar libro',
            headerStyle: { backgroundColor: '#151718' },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d500ff" />
          <Text style={styles.loadingText}>
            {checkingExchange ? 'Verificando intercambio...' : 'Cargando libros...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si ya tiene libro ofrecido, no mostrar nada (ya se mostró la alerta y se redirigió)
  if (hasOfferedBook) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Seleccionar libro',
          headerStyle: { backgroundColor: '#151718' },
          headerTintColor: '#fff',
        }}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

      <View style={styles.container}>
        <View style={styles.headerInfo}>
          <Ionicons name="information-circle" size={24} color="#d500ff" />
          <Text style={styles.headerInfoText}>
            Selecciona uno de los libros del solicitante que te interesa para el intercambio
          </Text>
        </View>

        {books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No hay libros disponibles</Text>
            <Text style={styles.emptySubtitle}>El usuario no tiene libros para intercambiar</Text>
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookCard}
                onPress={() => handleSelectBook(item.id_libro)}
                disabled={selecting}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: item.imagenes?.[0]?.url_imagen || 'https://via.placeholder.com/80x120/333/fff',
                  }}
                  style={styles.bookImage}
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {item.autor}
                  </Text>
                  {item.generos && item.generos.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.genresContainer}
                      contentContainerStyle={styles.genresContent}
                    >
                      {item.generos.slice(0, 2).map((genero: any, index: number) => {
                        const genreName = genero.nombre_genero || genero.nombre || genero;
                        return (
                          <GenreChip
                            key={index}
                            genre={genreName}
                            size="small"
                            variant="filled"
                          />
                        );
                      })}
                      {item.generos.length > 2 && (
                        <View style={styles.moreGenres}>
                          <Text style={styles.moreGenresText}>+{item.generos.length - 2}</Text>
                        </View>
                      )}
                    </ScrollView>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id_libro.toString()}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {selecting && (
        <View style={styles.selectingOverlay}>
          <ActivityIndicator size="large" color="#d500ff" />
          <Text style={styles.selectingText}>Seleccionando libro...</Text>
        </View>
      )}
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
    backgroundColor: '#151718',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d500ff',
  },
  headerInfoText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  listContainer: {
    padding: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  bookImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  genresContainer: {
    maxHeight: 30,
    marginTop: 8,
  },
  genresContent: {
    alignItems: 'center',
  },
  moreGenres: {
    backgroundColor: '#444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreGenresText: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});
