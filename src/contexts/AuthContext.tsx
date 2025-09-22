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
    console.log('🔄 AuthContext: Carregando dados armazenados...');
    
    try {
      const storedToken = await authService.getStoredToken();
      console.log('🔑 AuthContext: Token armazenado:', storedToken ? 'encontrado' : 'não encontrado');
      
      if (storedToken) {
        console.log('✅ AuthContext: Verificando validade do token...');
        
        // Definir o token primeiro para que o interceptor possa usá-lo
        setToken(storedToken);
        
        try {
          const profileResponse = await authService.getProfile();
          console.log('✅ AuthContext: Token válido, usuário carregado:', profileResponse.user.email);
          setUser(profileResponse.user);
        } catch (error) {
          console.log('❌ AuthContext: Token inválido, fazendo logout...', error.response?.status);
          await authService.logout();
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('ℹ️ AuthContext: Nenhum token armazenado, usuário não logado');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro ao carregar dados:', error);
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      console.log('🏁 AuthContext: Carregamento finalizado');
    }
  }

  async function signIn(email: string, password: string) {
    console.log('🔐 AuthContext: Iniciando login para:', email);
    
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      console.log('✅ AuthContext: Login bem-sucedido, salvando dados...');
      
      // Salvar dados no storage primeiro
      await authService.saveToken(response.access_token);
      await authService.saveUser(response.user);
      console.log('💾 AuthContext: Dados salvos no storage');
      
      // Depois atualizar o estado
      setUser(response.user);
      setToken(response.access_token);
      console.log('🎉 AuthContext: Estado atualizado, usuário logado:', response.user.email);
    } catch (error) {
      console.error('❌ AuthContext: Erro no login:', error.response?.data || error.message);
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
    console.log('🚪 AuthContext: Fazendo logout...');
    
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setToken(null);
      console.log('✅ AuthContext: Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ AuthContext: Erro no logout:', error);
      // Mesmo com erro, limpar o estado local
      setUser(null);
      setToken(null);
      console.log('🧹 AuthContext: Estado limpo mesmo com erro');
    } finally {
      setLoading(false);
    }
  }

  async function getToken(): Promise<string | null> {
    console.log('🔑 AuthContext: getToken chamado, token no estado:', token ? 'existe' : 'não existe');
    
    if (token) {
      console.log('✅ AuthContext: Retornando token do estado');
      return token;
    }
    
    // Se não há token no estado, tentar obter do storage
    try {
      const storedToken = await authService.getStoredToken();
      if (storedToken) {
        console.log('📱 AuthContext: Token encontrado no storage, atualizando estado');
        setToken(storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error('❌ AuthContext: Erro ao obter token do storage:', error);
    }
    
    console.log('❌ AuthContext: Nenhum token disponível');
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

  // Log do estado atual para debug
  console.log('📊 AuthContext: Estado atual -', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    isAuthenticated: !!user,
    userEmail: user?.email
  });

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
