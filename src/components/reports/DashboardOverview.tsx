import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  walletsCount: number;
  transactionsCount: number;
  categoriesCount: number;
  pendingInstallments: number;
  topCategories: Array<{
    id: number;
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }>;
  recentTransactions: Array<{
    id: number;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    category: {
      name: string;
      color: string;
      icon: string;
    };
  }>;
}

interface DashboardOverviewProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
  refreshing: boolean;
}

export default function DashboardOverview({ dateRange, refreshing }: DashboardOverviewProps) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { getToken, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, refreshing]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
      });

      const response = await api.get(`/reports/dashboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="analytics" size={48} color={theme.textSecondary} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={64} color={theme.textSecondary} />
        <Text style={styles.emptyText}>Nenhum dado encontrado</Text>
        <Text style={styles.emptySubtext}>
          Adicione algumas transações para ver o dashboard
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cards de Resumo */}
      <View style={styles.summaryCards}>
        <View style={[styles.card, styles.balanceCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet" size={24} color={theme.primary} />
            <Text style={styles.cardTitle}>Saldo Total</Text>
          </View>
          <Text style={[styles.cardValue, styles.balanceValue]}>
            {formatCurrency(data.totalBalance)}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <View style={[styles.card, styles.halfCard, styles.incomeCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.cardTitle}>Receitas</Text>
            </View>
            <Text style={[styles.cardValue, { color: '#4CAF50' }]}>
              {formatCurrency(data.monthlyIncome)}
            </Text>
          </View>

          <View style={[styles.card, styles.halfCard, styles.expenseCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-down" size={20} color="#F44336" />
              <Text style={styles.cardTitle}>Despesas</Text>
            </View>
            <Text style={[styles.cardValue, { color: '#F44336' }]}>
              {formatCurrency(data.monthlyExpenses)}
            </Text>
          </View>
        </View>
      </View>

      {/* Estatísticas Rápidas */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="card" size={24} color={theme.primary} />
            <Text style={styles.statValue}>{data.walletsCount}</Text>
            <Text style={styles.statLabel}>Carteiras</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="swap-horizontal" size={24} color={theme.primary} />
            <Text style={styles.statValue}>{data.transactionsCount}</Text>
            <Text style={styles.statLabel}>Transações</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="folder" size={24} color={theme.primary} />
            <Text style={styles.statValue}>{data.categoriesCount}</Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color={theme.primary} />
            <Text style={styles.statValue}>{data.pendingInstallments}</Text>
            <Text style={styles.statLabel}>Parcelas</Text>
          </View>
        </View>
      </View>

      {/* Top Categorias */}
      {data.topCategories.length > 0 && (
        <View style={styles.topCategoriesContainer}>
          <Text style={styles.sectionTitle}>Principais Categorias</Text>
          {data.topCategories.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={16} color="white" />
                </View>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Transações Recentes */}
      {data.recentTransactions.length > 0 && (
        <View style={styles.recentTransactionsContainer}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          {data.recentTransactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={[styles.transactionIcon, { backgroundColor: transaction.category.color }]}>
                  <Ionicons name={transaction.category.icon as any} size={16} color="white" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {transaction.category.name} • {formatDate(transaction.date)}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336' }
              ]}>
                {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCards: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  balanceCard: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  balanceValue: {
    fontSize: 28,
    color: theme.primary,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  topCategoriesContainer: {
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  categoryPercentage: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  recentTransactionsContainer: {
    marginBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
