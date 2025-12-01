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
import CustomAlert, { AlertButton } from '../../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { showAlert, AlertDialog } = useAlertDialog();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!nombreUsuario || !password) {
      showAlert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario.trim(), // Usar nombre_usuario
          password,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Guardar en el contexto de autenticación
        await login(result.data.user, result.data.tokens);
        
        showAlert(
          '¡Inicio de Sesión Exitoso!',
          'Bienvenido de nuevo a Bookify',
          [
            {
              text: 'Continuar',
              onPress: () => {
                router.replace('/(tabs)/Inicio');
              }
            }
          ]
        );
      } else {
        showAlert('Error', result.message || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      showAlert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/Auth/Register');
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
            {/* Logo/Title */}
            <View style={styles.headerSection}>
              <Text style={styles.appName}>📚 Bookify</Text>
              <Text style={styles.welcomeText}>Bienvenido de nuevo</Text>
            </View>

            {/* Usuario Input */}
            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              placeholderTextColor="#888"
              value={nombreUsuario}
              onChangeText={setNombreUsuario}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password Input */}
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity onPress={navigateToRegister} style={styles.registerLink}>
              <Text style={styles.registerText}>
                ¿No tienes cuenta?{' '}
                <Text style={styles.registerTextBold}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  signInButton: {
    backgroundColor: '#8b00ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    color: '#888',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#8b00ff',
    fontWeight: '600',
  },
});
