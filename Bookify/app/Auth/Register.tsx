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

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombreUsuario || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
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
        
        Alert.alert('¡Registro Exitoso!', 'Tu cuenta ha sido creada', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/Inicio'),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'No se pudo registrar el usuario');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/Auth/Login');
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
      </KeyboardAvoidingView>
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