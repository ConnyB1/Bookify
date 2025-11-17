import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserData, getTokens, saveUserData, saveTokens, logout as logoutUtil, UserData, UserTokens } from '../utils/auth';
import { API_CONFIG, buildApiUrl } from '../config/api';

interface AuthContextType {
  user: UserData | null;
  tokens: UserTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserData, tokens: UserTokens) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: UserData) => Promise<void>;
  syncUserFromBackend: () => Promise<void>; // Nueva función para sincronizar
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [tokens, setTokens] = useState<UserTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al iniciar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [savedUser, savedTokens] = await Promise.all([
        getUserData(),
        getTokens(),
      ]);

      if (savedUser && savedTokens) {
        setUser(savedUser);
        setTokens(savedTokens);
        
        // Sincronizar datos del usuario desde el backend al iniciar
        await syncUserDataFromBackend(savedUser.id_usuario, savedTokens.accessToken);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncUserDataFromBackend = async (userId: number, token: string) => {
    try {
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.GET_PROFILE),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        // ✅ FIX: El backend devuelve result.data.user, no result.data directamente
        if (result.success && result.data && result.data.user) {
          const userData = result.data.user; // Extraer el objeto user anidado
          
          const updatedUser: UserData = {
            id_usuario: userData.id_usuario,
            nombre_usuario: userData.nombre_usuario,
            email: userData.email,
            genero: userData.genero,
            foto_perfil_url: userData.foto_perfil_url,
            latitud: userData.latitud,
            longitud: userData.longitud,
            ciudad: userData.ciudad,
            radio_busqueda_km: userData.radio_busqueda_km,
            ubicacion_actualizada_at: userData.ubicacion_actualizada_at,
          };
          
          await saveUserData(updatedUser);
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error sincronizando usuario:', error);
    }
  };

  const syncUserFromBackend = async () => {
    if (!user || !tokens) {
      return;
    }
    await syncUserDataFromBackend(user.id_usuario, tokens.accessToken);
  };

  const login = async (userData: UserData, userTokens: UserTokens) => {
    await Promise.all([
      saveUserData(userData),
      saveTokens(userTokens),
    ]);
    setUser(userData);
    setTokens(userTokens);
  };

  const logout = async () => {
    await logoutUtil();
    setUser(null);
    setTokens(null);
  };

  // ======================================================
  // 2. FUNCIÓN 'updateUser' AÑADIDA DE VUELTA
  // ======================================================
  const updateUser = async (userData: UserData) => {
    try {
      // Guardar los datos actualizados en el almacenamiento (usando tu util)
      await saveUserData(userData);
      // Actualizar el estado en la app
      setUser(userData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isAuthenticated: !!user && !!tokens,
        login,
        logout,
        updateUser,
        syncUserFromBackend,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};