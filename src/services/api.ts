import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Wallet, Transaction, Category, CreditCard } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Storage para React Native (sempre usar AsyncStorage)
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      console.log('📱 Storage: Tentando obter', key);
      const value = await AsyncStorage.getItem(key);
      console.log('📱 Storage: Resultado para', key, ':', value ? 'encontrado' : 'não encontrado');
      return value;
    } catch (error) {
      console.error('❌ Storage: Erro ao obter', key, ':', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      console.log('📱 Storage: Salvando', key);
      await AsyncStorage.setItem(key, value);
      console.log('✅ Storage: Salvo com sucesso', key);
    } catch (error) {
      console.error('❌ Storage: Erro ao salvar', key, ':', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      console.log('📱 Storage: Removendo', key);
      await AsyncStorage.removeItem(key);
      console.log('✅ Storage: Removido com sucesso', key);
    } catch (error) {
      console.error('❌ Storage: Erro ao remover', key, ':', error);
    }
  },
};

// Token global para o interceptor
let globalToken: string | null = null;

// Função para definir o token global
export function setGlobalToken(token: string | null) {
  console.log('🔑 API: Definindo token global:', token ? 'definido' : 'removido');
  globalToken = token;
}

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  // Tentar usar token global primeiro, depois storage
  let token = globalToken;
  
  if (!token) {
    token = await storage.getItem('access_token');
  }
  
  console.log('🌐 API Request:', config.method?.toUpperCase(), config.url, token ? 'com token' : 'sem token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('Token expirado, limpando storage e token global...');
      globalToken = null;
      await storage.removeItem('access_token');
      await storage.removeItem('user');
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async saveToken(token: string): Promise<void> {
    console.log('💾 AuthService: Salvando token no storage...');
    await storage.setItem('access_token', token);
    setGlobalToken(token);
    console.log('✅ AuthService: Token salvo com sucesso');
  },

  async saveUser(user: User): Promise<void> {
    console.log('💾 AuthService: Salvando usuário no storage:', user.email);
    await storage.setItem('user', JSON.stringify(user));
    console.log('✅ AuthService: Usuário salvo com sucesso');
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await storage.getItem('user');
    console.log('Getting stored user:', userStr ? 'found' : 'not found');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getStoredToken(): Promise<string | null> {
    const token = await storage.getItem('access_token');
    console.log('Getting stored token:', token ? 'found' : 'not found');
    
    if (token) {
      setGlobalToken(token);
    }
    
    return token;
  },

  async logout(): Promise<void> {
    console.log('Fazendo logout, limpando storage...');
    setGlobalToken(null);
    await storage.removeItem('access_token');
    await storage.removeItem('user');
    console.log('Storage limpo com sucesso');
  },
};

export const walletService = {
  async getAll(type?: string): Promise<Wallet[]> {
    const params = type ? { type } : {};
    const response = await api.get('/wallets', { params });
    return response.data;
  },

  async getById(id: number): Promise<Wallet> {
    const response = await api.get(`/wallets/${id}`);
    return response.data;
  },

  async create(data: {
    name: string;
    type?: string;
    initialBalance?: number;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Wallet> {
    const response = await api.post('/wallets', data);
    return response.data;
  },

  async update(id: number, data: {
    name?: string;
    type?: string;
    currentBalance?: number;
    description?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
  }): Promise<Wallet> {
    const response = await api.patch(`/wallets/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/wallets/${id}`);
  },

  async toggleActive(id: number): Promise<Wallet> {
    const response = await api.patch(`/wallets/${id}/toggle-active`);
    return response.data;
  },

  async getSummary(): Promise<{
    totalBalance: number;
    walletsCount: number;
    walletsByType: Record<string, { count: number; balance: number }>;
    wallets: Array<{
      id: number;
      name: string;
      type: string;
      currentBalance: number;
      color: string;
      icon: string;
    }>;
  }> {
    const response = await api.get('/wallets/summary');
    return response.data;
  },

  async getStatistics(): Promise<{
    totalWallets: number;
    activeWallets: number;
    totalBalance: number;
    monthlyTransactions: number;
    averageBalance: number;
    highestBalance: number;
    lowestBalance: number;
    mostUsedWallet: Wallet | null;
  }> {
    const response = await api.get('/wallets/statistics');
    return response.data;
  },

  async getBalanceHistory(id: number, days: number = 30): Promise<{
    walletId: number;
    walletName: string;
    period: string;
    history: Array<{ date: string; balance: number }>;
  }> {
    const response = await api.get(`/wallets/${id}/balance-history`, {
      params: { days },
    });
    return response.data;
  },

  async getTypes(): Promise<{
    types: Array<{ value: string; label: string; icon: string }>;
  }> {
    const response = await api.get('/wallets/types');
    return response.data;
  },

  // Métodos de compatibilidade com versão anterior
  async getWallets(): Promise<Wallet[]> {
    return this.getAll();
  },

  async createWallet(name: string, initialBalance: number): Promise<Wallet> {
    return this.create({ name, initialBalance });
  },

  async getWalletsSummary(): Promise<{
    totalBalance: number;
    walletsCount: number;
    wallets: Array<{ id: number; name: string; currentBalance: number }>;
  }> {
    const summary = await this.getSummary();
    return {
      totalBalance: summary.totalBalance,
      walletsCount: summary.walletsCount,
      wallets: summary.wallets.map(w => ({
        id: w.id,
        name: w.name,
        currentBalance: w.currentBalance,
      })),
    };
  },

  async updateWallet(id: number, data: { name?: string; currentBalance?: number }): Promise<Wallet> {
    return this.update(id, data);
  },

  async deleteWallet(id: number): Promise<void> {
    return this.delete(id);
  },
};

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get('/transactions');
    return response.data;
  },

  async createTransaction(data: {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    categoryId: number;
    walletId: number;
    date: string;
  }): Promise<Transaction> {
    const response = await api.post('/transactions', data);
    return response.data;
  },
};

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },

  async createCategory(name: string, parentId?: number): Promise<Category> {
    const response = await api.post('/categories', { name, parentId });
    return response.data;
  },
};

export default api;
