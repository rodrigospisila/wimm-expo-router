import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

interface CategoryStatistic {
  categoryId: number;
  categoryName: string;
  categoryType: 'INCOME' | 'EXPENSE';
  categoryColor: string;
  monthlyBudget?: number;
  totalAmount: number;
  transactionCount: number;
  budgetUsagePercentage?: number;
}

interface CategoryStatisticsProps {
  selectedCategoryId?: number;
  onCategorySelect?: (categoryId: number | undefined) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const CategoryStatistics: React.FC<CategoryStatisticsProps> = ({
  selectedCategoryId,
  onCategorySelect,
}) => {
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
  const { getToken, signOut } = useAuth();
  const [statistics, setStatistics] = useState<CategoryStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [selectedCategoryId]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentToken = await getToken();
      if (!currentToken) {
        setError('Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const params = new URLSearchParams();
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId.toString());
      }

      const response = await api.get(`/categories/statistics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      setStatistics(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      if (error.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        setError('Não foi possível carregar as estatísticas');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTotalByType = (type: 'INCOME' | 'EXPENSE') => {
    return statistics
      .filter(stat => stat.categoryType === type)
      .reduce((total, stat) => total + stat.totalAmount, 0);
  };

  const getTopCategories = (type: 'INCOME' | 'EXPENSE', limit: number = 5) => {
    return statistics
      .filter(stat => stat.categoryType === type)
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
      .slice(0, limit);
  };

  const getBudgetAlerts = () => {
    return statistics
      .filter(stat => 
        stat.monthlyBudget && 
        stat.budgetUsagePercentage && 
        stat.budgetUsagePercentage > 80
      )
      .sort((a, b) => (b.budgetUsagePercentage || 0) - (a.budgetUsagePercentage || 0));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(amount));
  };

  const renderStatisticCard = (stat: CategoryStatistic) => (
    <TouchableOpacity
      key={stat.categoryId}
      style={styles.statisticCard}
      onPress={() => onCategorySelect?.(stat.categoryId)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryIndicator, { backgroundColor: stat.categoryColor }]} />
        <Text style={styles.categoryName} numberOfLines={1}>
          {stat.categoryName}
        </Text>
      </View>
      
      <Text style={styles.amount}>
        {formatCurrency(stat.totalAmount)}
      </Text>
      
      <Text style={styles.transactionCount}>
        {stat.transactionCount} transações
      </Text>

      {stat.monthlyBudget && stat.budgetUsagePercentage && (
        <View style={styles.budgetContainer}>
          <View style={styles.budgetBar}>
            <View
              style={[
                styles.budgetProgress,
                {
                  width: `${Math.min(stat.budgetUsagePercentage, 100)}%`,
                  backgroundColor: stat.budgetUsagePercentage > 100 ? '#FF3B30' : 
                                 stat.budgetUsagePercentage > 80 ? '#FF9500' : '#34C759',
                },
              ]}
            />
          </View>
          <Text style={styles.budgetText}>
            {stat.budgetUsagePercentage.toFixed(0)}% do orçamento
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderBudgetAlert = (stat: CategoryStatistic) => (
    <TouchableOpacity
      key={stat.categoryId}
      style={[
        styles.alertCard,
        { borderLeftColor: stat.budgetUsagePercentage! > 100 ? '#FF3B30' : '#FF9500' }
      ]}
      onPress={() => onCategorySelect?.(stat.categoryId)}
    >
      <View style={styles.alertHeader}>
        <Ionicons
          name={stat.budgetUsagePercentage! > 100 ? 'warning' : 'alert-circle'}
          size={20}
          color={stat.budgetUsagePercentage! > 100 ? '#FF3B30' : '#FF9500'}
        />
        <Text style={styles.alertTitle}>
          {stat.budgetUsagePercentage! > 100 ? 'Orçamento Excedido' : 'Orçamento Quase Esgotado'}
        </Text>
      </View>
      <Text style={styles.alertCategory}>{stat.categoryName}</Text>
      <Text style={styles.alertDetails}>
        {formatCurrency(stat.totalAmount)} de {formatCurrency(stat.monthlyBudget!)} 
        ({stat.budgetUsagePercentage!.toFixed(0)}%)
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
          <Text style={styles.retryText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (statistics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Nenhuma estatística disponível</Text>
        <Text style={styles.emptySubtext}>
          Adicione algumas transações para ver as estatísticas
        </Text>
      </View>
    );
  }

  const totalIncome = getTotalByType('INCOME');
  const totalExpense = getTotalByType('EXPENSE');
  const balance = totalIncome - Math.abs(totalExpense);
  const topIncomeCategories = getTopCategories('INCOME');
  const topExpenseCategories = getTopCategories('EXPENSE');
  const budgetAlerts = getBudgetAlerts();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Resumo Geral */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Resumo do Mês</Text>
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Ionicons name="trending-up" size={24} color="#34C759" />
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Ionicons name="trending-down" size={24} color="#FF3B30" />
            <Text style={styles.summaryLabel}>Despesas</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalExpense)}</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Ionicons 
              name={balance >= 0 ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={balance >= 0 ? "#34C759" : "#FF3B30"} 
            />
            <Text style={styles.summaryLabel}>Saldo</Text>
            <Text style={[
              styles.summaryAmount,
              { color: balance >= 0 ? "#34C759" : "#FF3B30" }
            ]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        </View>
      </View>

      {/* Alertas de Orçamento */}
      {budgetAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas de Orçamento</Text>
          {budgetAlerts.map(renderBudgetAlert)}
        </View>
      )}

      {/* Top Receitas */}
      {topIncomeCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais Receitas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.horizontalList}>
              {topIncomeCategories.map(renderStatisticCard)}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Top Despesas */}
      {topExpenseCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais Despesas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.horizontalList}>
              {topExpenseCategories.map(renderStatisticCard)}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  statisticCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: screenWidth * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  budgetContainer: {
    marginTop: 8,
  },
  budgetBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 2,
  },
  budgetText: {
    fontSize: 10,
    color: '#666',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  alertCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertDetails: {
    fontSize: 14,
    color: '#666',
  },
});

export default CategoryStatistics;



const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 16,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  statisticCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: screenWidth * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 8,
  },
  budgetContainer: {
    marginTop: 8,
  },
  budgetBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 2,
  },
  budgetText: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  alertCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  alertDetails: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
});
