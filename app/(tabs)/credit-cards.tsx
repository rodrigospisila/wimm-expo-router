import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Title, Text, Card, Button, Snackbar, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { creditCardService } from '../../src/services/api';
import { useRouter } from 'expo-router';

interface CreditCardBill {
  id: number;
  name: string;
  creditLimit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  currentBill: {
    month: number;
    year: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    status: 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';
    transactions: Array<{
      id: number;
      description: string;
      amount: number;
      date: string;
      category: {
        name: string;
        color: string;
        icon: string;
      };
      installmentInfo?: {
        currentInstallment: number;
        totalInstallments: number;
      };
    }>;
  };
  previousBills: Array<{
    month: number;
    year: number;
    totalAmount: number;
    paidAmount: number;
    status: 'PAID' | 'OVERDUE';
    dueDate: string;
  }>;
}

export default function CreditCardsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedCard, setSelectedCard] = useState<CreditCardBill | null>(null);

  useEffect(() => {
    if (user) {
      loadBills();
    }
  }, [user]);

  async function loadBills() {
    try {
      setLoading(true);
      const data = await creditCardService.getAllBills();
      setBills(data);
    } catch (error: any) {
      console.error('Error loading credit card bills:', error);
      
      if (error.response?.status !== 401) {
        showSnackbar('Erro ao carregar faturas. Verifique sua conexão.');
      }
      
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadBills();
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
      year: 'numeric',
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PAID': return '#2e7d32';
      case 'OVERDUE': return '#d32f2f';
      case 'CLOSED': return '#f57c00';
      case 'OPEN': return '#1976d2';
      default: return '#666';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'PAID': return 'Paga';
      case 'OVERDUE': return 'Vencida';
      case 'CLOSED': return 'Fechada';
      case 'OPEN': return 'Aberta';
      default: return status;
    }
  }

  function getUsagePercentage(used: number, limit: number) {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  }

  function getUsageColor(percentage: number) {
    if (percentage >= 90) return '#d32f2f';
    if (percentage >= 70) return '#f57c00';
    return '#2e7d32';
  }

  function handleCardPress(bill: CreditCardBill) {
    setSelectedCard(bill);
  }

  function handleViewBillDetails(bill: CreditCardBill) {
    // TODO: Navegar para tela de detalhes da fatura
    showSnackbar(`Detalhes da fatura ${bill.name} em desenvolvimento`);
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
          <Title style={styles.title}>Cartões de Crédito</Title>
          <Text style={styles.subtitle}>Gerencie suas faturas</Text>
        </View>

        {bills.length > 0 ? (
          bills.map((bill) => {
            const usedAmount = bill.creditLimit - bill.availableLimit;
            const usagePercentage = getUsagePercentage(usedAmount, bill.creditLimit);
            
            return (
              <Card key={bill.id} style={styles.cardContainer}>
                <TouchableOpacity onPress={() => handleCardPress(bill)}>
                  <Card.Content>
                    {/* Header do Cartão */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{bill.name}</Text>
                        <Text style={styles.cardDates}>
                          Fecha dia {bill.closingDay} • Vence dia {bill.dueDay}
                        </Text>
                      </View>
                      <MaterialIcons name="credit-card" size={24} color="#666" />
                    </View>

                    {/* Limite e Uso */}
                    <View style={styles.limitSection}>
                      <View style={styles.limitInfo}>
                        <Text style={styles.limitLabel}>Limite Disponível</Text>
                        <Text style={styles.limitValue}>
                          {formatCurrency(bill.availableLimit)}
                        </Text>
                      </View>
                      <View style={styles.limitInfo}>
                        <Text style={styles.limitLabel}>Limite Total</Text>
                        <Text style={styles.limitValue}>
                          {formatCurrency(bill.creditLimit)}
                        </Text>
                      </View>
                    </View>

                    {/* Barra de Uso */}
                    <View style={styles.usageSection}>
                      <View style={styles.usageHeader}>
                        <Text style={styles.usageLabel}>Uso do Limite</Text>
                        <Text style={[styles.usagePercentage, { color: getUsageColor(usagePercentage) }]}>
                          {usagePercentage.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.usageBarContainer}>
                        <View 
                          style={[
                            styles.usageBar, 
                            { 
                              width: `${usagePercentage}%`,
                              backgroundColor: getUsageColor(usagePercentage)
                            }
                          ]} 
                        />
                      </View>
                    </View>

                    {/* Fatura Atual */}
                    <View style={styles.billSection}>
                      <View style={styles.billHeader}>
                        <Text style={styles.billTitle}>Fatura Atual</Text>
                        <Chip 
                          style={[styles.statusChip, { backgroundColor: getStatusColor(bill.currentBill.status) }]}
                          textStyle={styles.statusChipText}
                        >
                          {getStatusText(bill.currentBill.status)}
                        </Chip>
                      </View>
                      
                      <View style={styles.billInfo}>
                        <View style={styles.billAmount}>
                          <Text style={styles.billAmountLabel}>Valor Total</Text>
                          <Text style={styles.billAmountValue}>
                            {formatCurrency(bill.currentBill.totalAmount)}
                          </Text>
                        </View>
                        <View style={styles.billDue}>
                          <Text style={styles.billDueLabel}>Vencimento</Text>
                          <Text style={styles.billDueValue}>
                            {formatDate(bill.currentBill.dueDate)}
                          </Text>
                        </View>
                      </View>

                      {/* Transações da Fatura */}
                      {bill.currentBill.transactions.length > 0 && (
                        <View style={styles.transactionsSection}>
                          <Text style={styles.transactionsTitle}>
                            Últimas Transações ({bill.currentBill.transactions.length})
                          </Text>
                          
                          {bill.currentBill.transactions.slice(0, 3).map((transaction) => (
                            <View key={transaction.id} style={styles.transactionItem}>
                              <View style={styles.transactionLeft}>
                                <View style={[styles.transactionIcon, { backgroundColor: transaction.category.color }]}>
                                  <MaterialIcons name={transaction.category.icon as any} size={16} color="#fff" />
                                </View>
                                <View>
                                  <Text style={styles.transactionDescription}>
                                    {transaction.description}
                                  </Text>
                                  <Text style={styles.transactionCategory}>
                                    {transaction.category.name}
                                    {transaction.installmentInfo && 
                                      ` • ${transaction.installmentInfo.currentInstallment}/${transaction.installmentInfo.totalInstallments}`
                                    }
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.transactionAmount}>
                                {formatCurrency(transaction.amount)}
                              </Text>
                            </View>
                          ))}
                          
                          {bill.currentBill.transactions.length > 3 && (
                            <TouchableOpacity 
                              style={styles.viewMoreButton}
                              onPress={() => handleViewBillDetails(bill)}
                            >
                              <Text style={styles.viewMoreText}>
                                Ver todas as {bill.currentBill.transactions.length} transações
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      {/* Botões de Ação */}
                      <View style={styles.actionButtons}>
                        <Button 
                          mode="outlined" 
                          style={styles.actionButton}
                          onPress={() => handleViewBillDetails(bill)}
                        >
                          Ver Fatura
                        </Button>
                        <Button 
                          mode="contained" 
                          style={[styles.actionButton, styles.payButton]}
                          onPress={() => showSnackbar('Pagamento em desenvolvimento')}
                        >
                          Pagar
                        </Button>
                      </View>
                    </View>
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="credit-card" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum cartão encontrado</Text>
              <Text style={styles.emptyText}>
                Você ainda não possui cartões de crédito cadastrados
              </Text>
              <Button 
                mode="contained" 
                style={styles.addButton}
                onPress={() => router.push('/wallets')}
              >
                Adicionar Cartão
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  cardDates: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  limitSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  limitInfo: {
    flex: 1,
  },
  limitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  usageSection: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#666',
  },
  usagePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  usageBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBar: {
    height: '100%',
    borderRadius: 3,
  },
  billSection: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusChip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  statusChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 14,
  },
  billInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  billAmount: {
    flex: 1,
  },
  billAmountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  billAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  billDue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  billDueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  billDueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  transactionsSection: {
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewMoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  payButton: {
    backgroundColor: '#2e7d32',
  },
  emptyCard: {
    marginHorizontal: 20,
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#2e7d32',
  },
  bottomSpacing: {
    height: 20,
  },
});
