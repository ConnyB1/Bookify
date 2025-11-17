import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@bookify_tokens';
const USER_KEY = '@bookify_user';

export interface UserTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface UserData {
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  genero?: string;
  foto_perfil_url?: string;
  latitud?: number;
  longitud?: number;
  ciudad?: string;
  radio_busqueda_km?: number;
  ubicacion_actualizada_at?: string;
}

export const saveTokens = async (tokens: UserTokens): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error guardando tokens:', error);
  }
};

export const getTokens = async (): Promise<UserTokens | null> => {
  try {
    const tokens = await AsyncStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error('Error obteniendo tokens:', error);
    return null;
  }
};

export const saveUserData = async (user: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error guardando usuario:', error);
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error cerrando sesión:', error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await getTokens();
  return tokens !== null;
};
