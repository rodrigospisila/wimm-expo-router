import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Title, Text, Card, Button, FAB, Snackbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { walletService } from '../../src/services/api';

interface WalletSummary {
  totalBalance: number;
  walletsCount: number;
  wallets: Array<{ id: number; name: string; currentBalance: number }>;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadSummary();
    }
  }, [user]);

  async function loadSummary() {
    try {
      setLoading(true);
      const data = await walletService.getWalletsSummary();
      setSummary(data);
    } catch (error: any) {
      console.error('Error loading summary:', error);
      
      // Se for erro 401, não mostrar snackbar pois o AuthContext já vai tratar
      if (error.response?.status !== 401) {
        showSnackbar('Erro ao carregar resumo. Verifique sua conexão.');
      }
      
      // Definir um resumo vazio para evitar tela em branco
      setSummary({
        totalBalance: 0,
        walletsCount: 0,
        wallets: []
      });
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadSummary();
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

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}!</Text>
            <Text style={styles.subtitle}>Bem-vindo ao Wimm</Text>
          </View>
          <MaterialIcons name="notifications" size={24} color="#666" />
        </View>

        {/* Resumo Financeiro */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Resumo Financeiro</Title>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Saldo Total</Text>
                <Text style={styles.summaryValue}>
                  {summary ? formatCurrency(summary.totalBalance) : 'R$ 0,00'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Carteiras</Text>
                <Text style={styles.summaryValue}>
                  {summary ? summary.walletsCount : 0}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Carteiras */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Suas Carteiras</Title>
          {summary && summary.wallets.length > 0 ? (
            summary.wallets.map((wallet) => (
              <Card key={wallet.id} style={styles.walletCard}>
                <Card.Content>
                  <View style={styles.walletContent}>
                    <View>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                      <Text style={styles.walletBalance}>
                        {formatCurrency(wallet.currentBalance)}
                      </Text>
                    </View>
                    <MaterialIcons name="account-balance-wallet" size={24} color="#2e7d32" />
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialIcons name="account-balance-wallet" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  Você ainda não tem carteiras cadastradas
                </Text>
                <Button mode="contained" style={styles.addButton}>
                  Adicionar Carteira
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Transações Recentes */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Transações Recentes</Title>
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="receipt-long" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                Nenhuma transação encontrada
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => showSnackbar('Adicionar transação em breve!')}
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
    backgroundColor: '#f5f5f5',
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
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    margin: 20,
    marginTop: 0,
    elevation: 4,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  walletCard: {
    marginBottom: 8,
    elevation: 2,
  },
  walletContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletBalance: {
    fontSize: 14,
    color: '#2e7d32',
    marginTop: 4,
  },
  emptyCard: {
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2e7d32',
  },
});
