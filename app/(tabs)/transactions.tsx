import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import CategorySelector from '../../src/components/CategorySelector';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: number;
  walletId: number;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
  };
  wallet: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Wallet {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  color: string;
  icon: string;
}

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
}

interface CreateTransactionData {
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number | null;
  walletId: number | null;
  date: string;
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { getToken, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Form state
  const [formData, setFormData] = useState<CreateTransactionData>({
    description: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: null,
    walletId: null,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadWallets(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const currentToken = await getToken();
      if (!currentToken) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const response = await api.get('/transactions', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setTransactions(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as transações');
      }
    }
  };

  const loadWallets = async () => {
    try {
      const currentToken = await getToken();
      if (!currentToken) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const response = await api.get('/wallets', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setWallets(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar carteiras:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const createTransaction = async () => {
    try {
      if (!formData.description.trim()) {
        Alert.alert('Erro', 'Descrição é obrigatória');
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        Alert.alert('Erro', 'Valor deve ser maior que zero');
        return;
      }

      if (!formData.categoryId) {
        Alert.alert('Erro', 'Selecione uma categoria');
        return;
      }

      if (!formData.walletId) {
        Alert.alert('Erro', 'Selecione uma carteira');
        return;
      }

      const transactionData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId,
        walletId: formData.walletId,
        date: formData.date,
      };

      const currentToken = await getToken();
      if (!currentToken) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      await api.post('/transactions', transactionData, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      Alert.alert('Sucesso', 'Transação criada com sucesso');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', error.response?.data?.message || 'Não foi possível criar a transação');
      }
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    try {
      await api.delete(`/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert('Sucesso', 'Transação excluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      Alert.alert('Erro', 'Não foi possível excluir a transação');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'EXPENSE',
      categoryId: null,
      walletId: null,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === 'ALL') return true;
    return transaction.type === filterType;
  });

  const getTotalByType = (type: 'INCOME' | 'EXPENSE') => {
    return transactions
      .filter(t => t.type === type)
      .reduce((total, t) => total + Math.abs(t.amount), 0);
  };

  const totalIncome = getTotalByType('INCOME');
  const totalExpense = getTotalByType('EXPENSE');
  const balance = totalIncome - totalExpense;

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onLongPress={() => {
        Alert.alert(
          'Excluir Transação',
          `Deseja excluir "${item.description}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: () => deleteTransaction(item.id),
            },
          ]
        );
      }}
    >
      <View style={styles.transactionIcon}>
        <View style={[styles.categoryIcon, { backgroundColor: item.category.color }]}>
          <Ionicons name={item.category.icon as any} size={20} color="white" />
        </View>
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category.name}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>

      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'INCOME' ? '#34C759' : '#FF3B30' }
        ]}>
          {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <Text style={styles.walletText}>{item.wallet.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWalletSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Carteira</Text>
      <View style={styles.walletSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletOption,
                formData.walletId === wallet.id && styles.selectedWalletOption,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, walletId: wallet.id }))}
            >
              <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                <Ionicons name={wallet.icon as any} size={16} color="white" />
              </View>
              <Text style={[
                styles.walletName,
                formData.walletId === wallet.id && styles.selectedWalletName,
              ]}>
                {wallet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryAmount, { color: '#34C759' }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[
            styles.summaryAmount,
            { color: balance >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            {formatCurrency(balance)}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'ALL' && styles.activeFilterButton]}
          onPress={() => setFilterType('ALL')}
        >
          <Text style={[styles.filterText, filterType === 'ALL' && styles.activeFilterText]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'INCOME' && styles.activeFilterButton]}
          onPress={() => setFilterType('INCOME')}
        >
          <Text style={[styles.filterText, filterType === 'INCOME' && styles.activeFilterText]}>
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'EXPENSE' && styles.activeFilterButton]}
          onPress={() => setFilterType('EXPENSE')}
        >
          <Text style={[styles.filterText, filterType === 'EXPENSE' && styles.activeFilterText]}>
            Despesas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
          <Text style={styles.emptySubtext}>
            Toque no botão + para adicionar sua primeira transação
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal para criar transação */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova Transação</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={createTransaction}
            >
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Tipo de transação */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tipo</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'INCOME' && styles.activeTypeButton,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'INCOME', categoryId: null }))}
                >
                  <Ionicons name="trending-up" size={20} color={formData.type === 'INCOME' ? 'white' : '#34C759'} />
                  <Text style={[
                    styles.typeText,
                    formData.type === 'INCOME' && styles.activeTypeText,
                  ]}>
                    Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'EXPENSE' && styles.activeTypeButton,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'EXPENSE', categoryId: null }))}
                >
                  <Ionicons name="trending-down" size={20} color={formData.type === 'EXPENSE' ? 'white' : '#FF3B30'} />
                  <Text style={[
                    styles.typeText,
                    formData.type === 'EXPENSE' && styles.activeTypeText,
                  ]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Almoço no restaurante"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                autoCapitalize="sentences"
              />
            </View>

            {/* Valor */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Valor</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0,00"
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                keyboardType="numeric"
              />
            </View>

            {/* Categoria */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Categoria</Text>
              <CategorySelector
                selectedCategoryId={formData.categoryId || undefined}
                onCategorySelect={(category) => 
                  setFormData(prev => ({ ...prev, categoryId: category?.id || null }))
                }
                transactionType={formData.type}
                placeholder="Selecionar categoria"
              />
            </View>

            {/* Carteira */}
            {renderWalletSelector()}

            {/* Data */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Data</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
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
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  walletText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    padding: 4,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  activeTypeText: {
    color: 'white',
  },
  walletSelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    minWidth: 100,
  },
  selectedWalletOption: {
    backgroundColor: '#E3F2FD',
  },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  walletName: {
    fontSize: 14,
    color: '#333',
  },
  selectedWalletName: {
    color: '#007AFF',
    fontWeight: '500',
  },
});



const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  addButton: {
    padding: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  summaryCard: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.text,
    opacity: 0.7,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: theme.card,
  },
  activeFilterButton: {
    backgroundColor: theme.primary,
  },
  filterText: {
    fontSize: 14,
    color: theme.text,
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  transactionIcon: {
    marginRight: 15,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  transactionCategory: {
    fontSize: 13,
    color: theme.text,
    opacity: 0.6,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.text,
    opacity: 0.5,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletText: {
    fontSize: 12,
    color: theme.text,
    opacity: 0.6,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  modalSaveButton: {
    padding: 5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  modalContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.card,
    color: theme.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: 5,
  },
  activeTypeButton: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  typeText: {
    fontSize: 16,
    marginLeft: 8,
  },
  activeTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  walletSelector: {
    flexDirection: 'row',
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 10,
  },
  selectedWalletOption: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  walletName: {
    fontSize: 14,
    color: theme.text,
  },
  selectedWalletName: {
    color: 'white',
    fontWeight: 'bold',
  },
});
