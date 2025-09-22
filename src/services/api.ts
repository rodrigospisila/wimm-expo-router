import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Wallet, Transaction, Category, CreditCard } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Storage para web e mobile
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Silently fail
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Silently fail
    }
  },
};

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
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
    await storage.setItem('access_token', token);
  },

  async saveUser(user: User): Promise<void> {
    await storage.setItem('user', JSON.stringify(user));
  },

  async getStoredUser(): Promise<User | null> {
    const userStr = await storage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getStoredToken(): Promise<string | null> {
    return await storage.getItem('access_token');
  },

  async logout(): Promise<void> {
    await storage.removeItem('access_token');
    await storage.removeItem('user');
  },
};

export const walletService = {
  async getWallets(): Promise<Wallet[]> {
    const response = await api.get('/wallets');
    return response.data;
  },

  async createWallet(name: string, initialBalance: number): Promise<Wallet> {
    const response = await api.post('/wallets', { name, initialBalance });
    return response.data;
  },

  async getWalletsSummary(): Promise<{
    totalBalance: number;
    walletsCount: number;
    wallets: Array<{ id: number; name: string; currentBalance: number }>;
  }> {
    const response = await api.get('/wallets/summary');
    return response.data;
  },

  async updateWallet(id: number, data: { name?: string; currentBalance?: number }): Promise<Wallet> {
    const response = await api.patch(`/wallets/${id}`, data);
    return response.data;
  },

  async deleteWallet(id: number): Promise<void> {
    await api.delete(`/wallets/${id}`);
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
