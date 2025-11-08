import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider style={styles.safeAreaProvider}>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen 
              name="Auth/Login" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="Auth/Register" 
              options={{ 
                headerShown: false,
                presentation: 'card',
              }} 
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
    backgroundColor: '#000000',
  },
});