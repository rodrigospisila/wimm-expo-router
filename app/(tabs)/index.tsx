import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Title, Text, Card, Button, FAB, Snackbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { walletService, reportsService } from '../../src/services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  };
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
  paymentMethodsUsage: Array<{
    id: number;
    name: string;
    amount: number;
    percentage: number;
    type: string;
  }>;
}

interface OverviewData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  walletsCount: number;
  transactionsCount: number;
  categoriesCount: number;
  activeInstallments: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [dashboard, overview] = await Promise.all([
        reportsService.getDashboard(),
        reportsService.getOverview(),
      ]);
      setDashboardData(dashboard);
      setOverviewData(overview);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      if (error.response?.status !== 401) {
        showSnackbar('Erro ao carregar dados. Verifique sua conexão.');
      }
      
      // Dados vazios para evitar tela em branco
      setDashboardData({
        period: { startDate: '', endDate: '' },
        summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
        topCategories: [],
        recentTransactions: [],
        paymentMethodsUsage: [],
      });
      setOverviewData({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlyBalance: 0,
        walletsCount: 0,
        transactionsCount: 0,
        categoriesCount: 0,
        activeInstallments: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }

  function showSnackbar(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  function getBalanceColor(balance: number) {
    if (balance > 0) return '#2e7d32'; // Verde
    if (balance < 0) return '#d32f2f'; // Vermelho
    return '#666'; // Neutro
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}!</Text>
            <Text style={styles.subtitle}>Aqui está seu resumo financeiro</Text>
          </View>
          <TouchableOpacity onPress={() => showSnackbar('Notificações em breve!')}>
            <MaterialIcons name="notifications" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Cards de Resumo Principal */}
        <View style={styles.summaryCards}>
          <Card style={[styles.summaryCard, styles.balanceCard]}>
            <Card.Content style={styles.summaryCardContent}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
              <Text style={styles.summaryCardLabel}>Saldo Total</Text>
              <Text style={styles.summaryCardValue}>
                {formatCurrency(overviewData?.totalBalance || 0)}
              </Text>
            </Card.Content>
          </Card>

          <View style={styles.summaryCardsRow}>
            <Card style={[styles.summaryCard, styles.incomeCard]}>
              <Card.Content style={styles.summaryCardContent}>
                <MaterialIcons name="trending-up" size={20} color="#fff" />
                <Text style={styles.summaryCardLabelSmall}>Receitas</Text>
                <Text style={styles.summaryCardValueSmall}>
                  {formatCurrency(dashboardData?.summary.totalIncome || 0)}
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.summaryCard, styles.expenseCard]}>
              <Card.Content style={styles.summaryCardContent}>
                <MaterialIcons name="trending-down" size={20} color="#fff" />
                <Text style={styles.summaryCardLabelSmall}>Despesas</Text>
                <Text style={styles.summaryCardValueSmall}>
                  {formatCurrency(dashboardData?.summary.totalExpense || 0)}
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Saldo do Mês */}
        <Card style={styles.monthlyBalanceCard}>
          <Card.Content>
            <View style={styles.monthlyBalanceContent}>
              <View>
                <Text style={styles.monthlyBalanceLabel}>Saldo do Mês</Text>
                <Text style={[
                  styles.monthlyBalanceValue,
                  { color: getBalanceColor(dashboardData?.summary.balance || 0) }
                ]}>
                  {formatCurrency(dashboardData?.summary.balance || 0)}
                </Text>
              </View>
              <View style={styles.monthlyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dashboardData?.summary.transactionCount || 0}</Text>
                  <Text style={styles.statLabel}>Transações</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{overviewData?.walletsCount || 0}</Text>
                  <Text style={styles.statLabel}>Carteiras</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Top Categorias */}
        {dashboardData?.topCategories && dashboardData.topCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Principais Categorias</Title>
              <TouchableOpacity onPress={() => router.push('/reports')}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {dashboardData.topCategories.slice(0, 5).map((category) => (
              <Card key={category.id} style={styles.categoryCard}>
                <Card.Content style={styles.categoryContent}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <MaterialIcons name={category.icon as any} size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}% do total</Text>
                    </View>
                  </View>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(Math.abs(category.amount))}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Transações Recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Transações Recentes</Title>
            <TouchableOpacity onPress={() => router.push('/launch')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
            dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <Card.Content style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: transaction.category.color }]}>
                      <MaterialIcons name={transaction.category.icon as any} size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionCategory}>
                        {transaction.category.name} • {formatDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'INCOME' ? '#2e7d32' : '#d32f2f' }
                    ]}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="receipt-long" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  Nenhuma transação encontrada
                </Text>
                <Button 
                  mode="contained" 
                  style={styles.addButton}
                  onPress={() => router.push('/launch')}
                >
                  Adicionar Transação
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Métodos de Pagamento Mais Usados */}
        {dashboardData?.paymentMethodsUsage && dashboardData.paymentMethodsUsage.length > 0 && (
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Métodos Mais Usados</Title>
            
            {dashboardData.paymentMethodsUsage.slice(0, 3).map((method) => (
              <Card key={method.id} style={styles.paymentMethodCard}>
                <Card.Content style={styles.paymentMethodContent}>
                  <View style={styles.paymentMethodLeft}>
                    <MaterialIcons name="credit-card" size={20} color="#666" />
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                  </View>
                  <View style={styles.paymentMethodRight}>
                    <Text style={styles.paymentMethodAmount}>
                      {formatCurrency(Math.abs(method.amount))}
                    </Text>
                    <Text style={styles.paymentMethodPercentage}>
                      {method.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/launch')}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryCards: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  summaryCard: {
    elevation: 3,
    borderRadius: 12,
  },
  balanceCard: {
    backgroundColor: '#2e7d32',
  },
  incomeCard: {
    backgroundColor: '#1976d2',
    flex: 1,
  },
  expenseCard: {
    backgroundColor: '#d32f2f',
    flex: 1,
  },
  summaryCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  summaryCardLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.9,
  },
  summaryCardLabelSmall: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  summaryCardValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryCardValueSmall: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  monthlyBalanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    borderRadius: 12,
  },
  monthlyBalanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  monthlyBalanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthlyStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  categoryCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodCard: {
    marginBottom: 8,
    elevation: 1,
    borderRadius: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  paymentMethodRight: {
    alignItems: 'flex-end',
  },
  paymentMethodAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  paymentMethodPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    elevation: 1,
    borderRadius: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    marginBottom: 16,
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#2e7d32',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2e7d32',
  },
  bottomSpacing: {
    height: 100,
  },
});
