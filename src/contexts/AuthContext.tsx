import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedToken = await authService.getStoredToken();
      
      if (storedToken) {
        // Verificar se o token ainda é válido fazendo uma requisição ao backend
        try {
          const profileResponse = await authService.getProfile();
          setUser(profileResponse.user);
          setToken(storedToken);
        } catch (error) {
          // Token inválido ou expirado, limpar dados
          console.log('Token inválido, fazendo logout...');
          await authService.logout();
          setUser(null);
          setToken(null);
        }
      } else {
        // Não há token armazenado
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      // Em caso de erro, limpar dados
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      await authService.saveToken(response.access_token);
      await authService.saveUser(response.user);
      
      setUser(response.user);
      setToken(response.access_token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(name: string, email: string, password: string) {
    try {
      setLoading(true);
      const response = await authService.register(name, email, password);
      
      await authService.saveToken(response.access_token);
      await authService.saveUser(response.user);
      
      setUser(response.user);
      setToken(response.access_token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Mesmo com erro, limpar o estado local
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function getToken(): Promise<string | null> {
    if (token) {
      return token;
    }
    
    // Tentar obter do storage se não estiver no estado
    try {
      const storedToken = await authService.getStoredToken();
      if (storedToken) {
        // Verificar se o token ainda é válido
        try {
          await authService.getProfile();
          setToken(storedToken);
          return storedToken;
        } catch (error) {
          // Token inválido, fazer logout
          console.log('Token expirado durante getToken, fazendo logout...');
          await signOut();
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    
    return null;
  }

  const value: AuthContextData = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
