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
  // Métodos V2 (principais)
  async getOverview(): Promise<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBalance: number;
    groupsCount: number;
    paymentMethodsCount: number;
    transactionsCount: number;
    groups: Array<{
      id: number;
      name: string;
      type: string;
      color: string;
      icon: string;
      totalBalance: number;
      paymentMethodsCount: number;
    }>;
  }> {
    const response = await api.get('/wallets-v2/overview');
    return response.data;
  },

  async getGroups(): Promise<Array<{
    id: number;
    name: string;
    type: string;
    description: string;
    color: string;
    icon: string;
    isActive: boolean;
    hasIntegratedPix: boolean;
    hasWalletBalance: boolean;
    paymentMethods: Array<{
      id: number;
      name: string;
      type: string;
      currentBalance: number;
      creditLimit?: number;
      availableLimit?: number;
      isPrimary: boolean;
      color: string;
      icon: string;
    }>;
  }>> {
    const response = await api.get('/wallets-v2/groups');
    return response.data;
  },

  async getPaymentMethods(): Promise<Array<{
    id: number;
    name: string;
    type: string;
    currentBalance: number;
    creditLimit?: number;
    availableLimit?: number;
    isPrimary: boolean;
    color: string;
    icon: string;
    walletGroup: {
      id: number;
      name: string;
      color: string;
      icon: string;
    };
  }>> {
    const response = await api.get('/wallets-v2/payment-methods');
    return response.data;
  },

  async getGroupTypes(): Promise<{
    types: Array<{ value: string; label: string; description: string; icon: string }>;
  }> {
    const response = await api.get('/wallets-v2/groups/types');
    return response.data;
  },

  async getPaymentMethodTypes(): Promise<{
    types: Array<{ value: string; label: string; description: string; icon: string }>;
  }> {
    const response = await api.get('/wallets-v2/payment-methods/types');
    return response.data;
  },

  async createGroup(data: {
    name: string;
    type: string;
    description?: string;
    color?: string;
    icon?: string;
    hasIntegratedPix?: boolean;
    hasWalletBalance?: boolean;
  }): Promise<any> {
    const response = await api.post('/wallets-v2/groups', data);
    return response.data;
  },

  async createPaymentMethod(data: {
    name: string;
    type: string;
    walletGroupId: number;
    currentBalance?: number;
    creditLimit?: number;
    closingDay?: number;
    dueDay?: number;
    isPrimary?: boolean;
    color?: string;
    icon?: string;
  }): Promise<any> {
    const response = await api.post('/wallets-v2/payment-methods', data);
    return response.data;
  },

  async createDefaultGroups(): Promise<any> {
    const response = await api.post('/wallets-v2/groups/create-defaults');
    return response.data;
  },

  // Métodos de compatibilidade V1
  async getAll(type?: string): Promise<Wallet[]> {
    const params = type ? { type } : {};
    const response = await api.get('/wallets', { params });
    return response.data;
  },

  async getWalletsSummary(): Promise<{
    totalBalance: number;
    walletsCount: number;
    wallets: Array<{ id: number; name: string; currentBalance: number }>;
  }> {
    try {
      const overview = await this.getOverview();
      return {
        totalBalance: overview.totalBalance,
        walletsCount: overview.groupsCount,
        wallets: overview.groups?.map(g => ({
          id: g.id,
          name: g.name,
          currentBalance: g.totalBalance,
        })) || [],
      };
    } catch (error) {
      console.error('Erro ao obter resumo das carteiras:', error);
      return {
        totalBalance: 0,
        walletsCount: 0,
        wallets: [],
      };
    }
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
    subcategoryId?: number;
    paymentMethodId: number;
    notes?: string;
    installmentNumber?: number;
  }): Promise<Transaction> {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async createInstallment(data: {
    description: string;
    totalAmount: number;
    installmentCount: number;
    paymentMethodId: number;
    categoryId: number;
    installmentType: string;
    notes?: string;
  }): Promise<any> {
    const response = await api.post('/transactions/installments', data);
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

  async createDefaults(): Promise<any> {
    const response = await api.post('/categories/create-defaults');
    return response.data;
  },
};

export default api;
