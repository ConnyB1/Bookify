// 📦 Importando componentes súper necesarios 📦
import { ThemedView } from '@/components/themed-view'; // 🎨 Vista con tema
import { ThemedText } from '@/components/themed-text'; // ✍️ Texto con tema
import LocationRequiredScreen from '@/components/LocationRequiredScreen'; // 📍 ¿Dónde estás?
import SearchBar from '@/components/SearchBar'; // 🔍 La barrita mágica
import GenreSelectorModal from '@/components/Bookify-componentes/GenreSelectorModal'; // 🎭 El modal de géneros
import SearchResults from '@/components/Bookify-componentes/SearchResults'; // 📉 Resultados (ojalá sean buenos)
import React, { useState } from 'react'; // ⚛️ El núcleo de todo
import { StyleSheet, View } from 'react-native'; // 📱 Cosas nativas
import { useBookSearch } from '../../hooks/useBookSearch'; // 🎣 Hook personalizado (muy pro)
import { GENRES } from '../../constants/search'; // 📚 Constantes de géneros
import Header from '@/components/Bookify-componentes/Encabezadobook'; // 🧢 El sombrero de la app
import { SafeAreaView } from 'react-native-safe-area-context'; // 🛡️ Zona segura activada

// 🚀 ¡Aquí comienza la magia! Componente principal
export default function BuscarScreen() {
  // 🎭 Estado para mostrar u ocultar el modal (suspenso...)
  const [showGenreModal, setShowGenreModal] = useState(false);

  // 🎣 Destructurando nuestro súper hook
  const {
    searchText,     // 📝 Lo que escribe el usuario
    setSearchText,  // ✍️ Función para cambiar lo que escribe
    selectedGenres, // 🏷️ Géneros elegidos
    books,          // 📚 La lista de libros (el tesoro)
    loading,        // ⏳ ¿Estamos cargando? (paciencia...)
    toggleGenre,    // 🔀 Palanca de géneros
    refetch,        // 🔄 ¡Inténtalo de nuevo!
  } = useBookSearch();

  // 🖼️ Renderizado de la UI
  return (
    // 🌍 Envolvemos todo porque necesitamos tu ubicación (no preguntes por qué)
    <LocationRequiredScreen>
      {/* 🛡️ Protegiendo el notch del iPhone */}
      <SafeAreaView style={styles.safeArea}>
        
        {/* 🎨 Contenedor principal con estilo */}
        <ThemedView style={styles.container}>
          
          {/* 🧢 Cabecera de la vista */}
          <View style={styles.header}>
            {/* 📢 Título gritando en negrita */}
            <ThemedText style={styles.title}>Buscar</ThemedText>
          </View>
          
          {/* 🔍 Componente de búsqueda (haz tu magia) */}
          <SearchBar
            value={searchText}
            onChangeText={setSearchText} // 🎹 Escuchando tecleo
            placeholder="Busca por título, autor... " // 👻 Texto fantasma motivacional
            onFilterPress={() => setShowGenreModal(true)} // 🔘 ¡Click en filtros!
            hasActiveFilters={selectedGenres.length > 0} // 🚦 ¿Hay filtros?
          />

          {/* 📦 Lista de resultados */}
          <SearchResults
            books={books}
            loading={loading} // 🌀 Girando...
            searchText={searchText}
            selectedGenres={selectedGenres}
          />
        </ThemedView>

        {/* 👻 El modal que aparece de la nada */}
        <GenreSelectorModal
          visible={showGenreModal} // 👀 ¿Me ves?
          genres={GENRES}
          selectedGenres={selectedGenres}
          onGenreToggle={toggleGenre} // 🎮 Acción de toggle
          onClose={() => setShowGenreModal(false)} // ❌ Adiós modal
        />
      </SafeAreaView>
    </LocationRequiredScreen>
  );
}

// 🎨 Estilos (porque el código feo no compila en el corazón) 💅
const styles = StyleSheet.create({
  safeArea: {
    flex: 1, // 📏 Ocupa todo el espacio
    backgroundColor: '#151718', // 🌑 Modo oscuro forever
  },
  container: {
    flex: 1, // 💪 Músculo flex
    paddingHorizontal: 16, // ↔️ Aire a los lados
    paddingTop: 20, // ⬆️ Aire arriba
  },
  header: {
    marginBottom: 20, // ⬇️ Empuja lo de abajo
  },
  title: {
    fontSize: 28, // 📏 Texto grandote
    fontWeight: 'bold', // 🏋️‍♂️ Texto fuerte
  },
});