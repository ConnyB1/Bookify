import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { API_CONFIG, buildApiUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import GenrePreferencesModal from '../../components/GenrePreferencesModal';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';

const useAlertDialog = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[] = [{ text: 'OK', onPress: () => {} }]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons.map(btn => ({
        ...btn,
        onPress: () => {
          btn.onPress();
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }
      })),
    });
  };

  const AlertDialog = () => (
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
    />
  );

  return { showAlert, AlertDialog };
};

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [showGenreModal, setShowGenreModal] = useState(false);

  const handleRegister = async () => {
    if (!nombreUsuario || !email || !password || !confirmPassword) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      showAlert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        await login(result.data.user, result.data.tokens);
        
        // Si el usuario seleccionó géneros, guardarlos
        if (selectedGenres.length > 0) {
          try {
            const genresResponse = await fetch(
              buildApiUrl(`/users/${result.data.user.id_usuario}/genre-preferences`),
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ genreIds: selectedGenres }),
              }
            );
            
            const genresResult = await genresResponse.json();
            console.log('Genre preferences saved:', genresResult);
          } catch (error) {
            console.error('Error saving genre preferences:', error);
            // No mostramos error al usuario, las preferencias se pueden configurar después
          }
        }
        
        showAlert(
          '¡Registro Exitoso!',
          'Tu cuenta ha sido creada correctamente. ¡Bienvenido a Bookify!',
          [
            {
              text: 'Comenzar',
              onPress: () => router.replace('/(tabs)/Inicio'),
            },
          ]
        );
      } else {
        showAlert('Error', result.message || 'No se pudo registrar el usuario');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      showAlert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/Auth/Login');
  };

  const handleGenreSelect = (genreIds: number[]) => {
    setSelectedGenres(genreIds);
    setShowGenreModal(false);
  };

  const getGenreButtonText = () => {
    if (selectedGenres.length === 0) {
      return 'Seleccionar géneros favoritos (opcional)';
    }
    return `${selectedGenres.length} género${selectedGenres.length > 1 ? 's' : ''} seleccionado${selectedGenres.length > 1 ? 's' : ''}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.appName}>📚 Bookify</Text>
              <Text style={styles.welcomeText}>Crear nueva cuenta</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              placeholderTextColor="#888"
              value={nombreUsuario}
              onChangeText={setNombreUsuario}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar Contraseña"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.genreButton}
              onPress={() => setShowGenreModal(true)}
            >
              <Ionicons name="book" size={20} color="#8b00ff" />
              <Text style={styles.genreButtonText}>{getGenreButtonText()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.loginTextBold}>Inicia sesión aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <GenrePreferencesModal
          visible={showGenreModal}
          onClose={() => setShowGenreModal(false)}
          onSave={handleGenreSelect}
          initialSelectedGenres={selectedGenres}
        />
      </KeyboardAvoidingView>
      <AlertDialog />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#888',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  genreButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  genreButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  signUpButton: {
    backgroundColor: '#8b00ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    color: '#888',
    fontSize: 14,
  },
  loginTextBold: {
    color: '#8b00ff',
    fontWeight: '600',
  },
});