import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserData, getTokens, saveUserData, saveTokens, logout as logoutUtil, UserData, UserTokens } from '../utils/auth';

interface AuthContextType {
  user: UserData | null;
  tokens: UserTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserData, tokens: UserTokens) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: UserData) => Promise<void>; // <-- 1. AÑADIDO DE VUELTA
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
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
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
        updateUser, // <-- 3. EXPUESTA EN EL CONTEXTO
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