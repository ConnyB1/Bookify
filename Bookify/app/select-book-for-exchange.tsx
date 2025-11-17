import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookSelection } from '../hooks/exchange/useBookSelection';
import { BookCard } from '../components/exchange/BookCard';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { EmptyState } from '../components/common/EmptyState';

export default function SelectBookForExchangeScreen() {
  const { chatId, exchangeId, otherUserId } = useLocalSearchParams<{
    chatId: string;
    exchangeId: string;
    otherUserId: string;
  }>();

  const { books, loading, selecting, selectBook } = useBookSelection(exchangeId, otherUserId);

  const handleSelectBook = (bookId: number) => {
    Alert.alert(
      'Confirmar selección',
      '¿Deseas ofrecer este libro para el intercambio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => selectBook(bookId) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Seleccionar libro',
            headerStyle: { backgroundColor: '#151718' },
            headerTintColor: '#fff',
          }}
        />
        <LoadingScreen message="Cargando libros..." backgroundColor="#151718" />
      </SafeAreaView>
    );
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

      <View style={styles.container}>
        <View style={styles.headerInfo}>
          <Ionicons name="information-circle" size={24} color="#d500ff" />
          <Text style={styles.headerInfoText}>
            Selecciona uno de los libros del solicitante que te interesa para el intercambio
          </Text>
        </View>

        {books.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No hay libros disponibles"
            subtitle="El usuario no tiene libros para intercambiar"
          />
        ) : (
          <FlatList
            data={books}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                onPress={() => handleSelectBook(item.id_libro)}
                disabled={selecting}
              />
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
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flex: 1, backgroundColor: '#151718' },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d500ff',
  },
  headerInfoText: { flex: 1, color: '#fff', fontSize: 14, marginLeft: 12, lineHeight: 20 },
  listContainer: { padding: 12 },
  separator: { height: 12 },
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
  selectingText: { color: '#fff', marginTop: 12, fontSize: 16 },
});
