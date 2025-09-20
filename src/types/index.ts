export interface User {
  id: number;
  name: string;
  email: string;
  themePreference?: 'LIGHT' | 'DARK' | 'SYSTEM';
  biometricEnabled?: boolean;
  notificationSettings?: {
    budget_alerts: boolean;
    bill_reminders: boolean;
    transaction_confirmations: boolean;
  };
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Wallet {
  id: number;
  name: string;
  currentBalance: number;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number;
  userId: number;
  createdAt?: string;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  walletId: number;
  userId: number;
  date: string;
  createdAt?: string;
}

export interface CreditCard {
  id: number;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  userId: number;
  createdAt?: string;
}
