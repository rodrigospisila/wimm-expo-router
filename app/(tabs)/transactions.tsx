import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { 
  Title, 
  Text, 
  Card, 
  Button, 
  Snackbar, 
  Searchbar,
  Chip,
  Portal,
  FAB,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { transactionService, categoryService, walletService } from '../../src/services/api';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import InstallmentCard from '../../src/components/InstallmentCard';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
  paymentMethod: {
    id: number;
    name: string;
    type: string;
    color: string;
    walletGroup?: {
      id: number;
      name: string;
      color: string;
      icon: string;
    };
  };
  installment?: {
    id: number;
    installmentCount: number;
    currentInstallment: number;
  };
  installmentId?: number;
  installmentNumber?: number;
}

interface Filters {
  search: string;
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: number;
  paymentMethodId?: number;
  startDate?: string;
  endDate?: string;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [expandedInstallments, setExpandedInstallments] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState<Filters>({
    search: '',
  });

  const [activeFilters, setActiveFilters] = useState<Filters>({
    search: '',
  });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadInitialData();
      }
    }, [user])
  );

  async function loadInitialData() {
    await Promise.all([
      loadTransactions(),
      loadCategories(),
      loadPaymentMethods(),
    ]);
  }

  async function loadTransactions(page = 1, newFilters?: Filters) {
    try {
      setLoading(page === 1);
      
      const filtersToUse = newFilters || activeFilters;
      const searchFilters: any = {
        page,
        limit: pagination.limit,
      };

      if (filtersToUse.search) searchFilters.search = filtersToUse.search;
      if (filtersToUse.type) searchFilters.type = filtersToUse.type;
      if (filtersToUse.categoryId) searchFilters.categoryId = filtersToUse.categoryId;
      if (filtersToUse.paymentMethodId) searchFilters.paymentMethodId = filtersToUse.paymentMethodId;
      if (filtersToUse.startDate) searchFilters.startDate = filtersToUse.startDate;
      if (filtersToUse.endDate) searchFilters.endDate = filtersToUse.endDate;

      const data = await transactionService.getTransactions(searchFilters);
      
      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      
      if (error.response?.status !== 401) {
        showSnackbar('Erro ao carregar transações. Verifique sua conexão.');
      }
      
      if (page === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadPaymentMethods() {
    try {
      const data = await walletService.getAllPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTransactions(1);
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

  function handleSearch(query: string) {
    const newFilters = { ...filters, search: query };
    setFilters(newFilters);
    
    // Debounce search
    setTimeout(() => {
      setActiveFilters(newFilters);
      loadTransactions(1, newFilters);
    }, 500);
  }

  function applyFilters() {
    setActiveFilters(filters);
    setFiltersVisible(false);
    loadTransactions(1, filters);
  }

  function clearFilters() {
    const clearedFilters = { search: filters.search };
    setFilters(clearedFilters);
    setActiveFilters(clearedFilters);
    setFiltersVisible(false);
    loadTransactions(1, clearedFilters);
  }

  function loadMore() {
    if (pagination.page < pagination.pages && !loading) {
      loadTransactions(pagination.page + 1);
    }
  }

  function getActiveFiltersCount() {
    let count = 0;
    if (activeFilters.type) count++;
    if (activeFilters.categoryId) count++;
    if (activeFilters.paymentMethodId) count++;
    if (activeFilters.startDate || activeFilters.endDate) count++;
    return count;
  }

  function getCategoryName(id: number) {
    const category = categories.find(c => c.id === id);
    return category?.name || 'Categoria';
  }

  function getPaymentMethodName(id: number) {
    const method = paymentMethods.find(m => m.id === id);
    return method?.name || 'Método';
  }

  // Função para agrupar transações parceladas
  function groupTransactions() {
    const installmentGroups = new Map();
    const regularTransactions: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.installment && transaction.installmentId) {
        const installmentId = transaction.installmentId;
        
        if (!installmentGroups.has(installmentId)) {
          installmentGroups.set(installmentId, {
            installmentId,
            description: transaction.description,
            totalAmount: 0,
            installmentCount: transaction.installment.installmentCount,
            paidInstallments: transaction.installment.currentInstallment,
            category: transaction.category,
            paymentMethod: transaction.paymentMethod,
            transactions: [],
            type: transaction.type,
          });
        }

        const group = installmentGroups.get(installmentId);
        group.transactions.push(transaction);
        group.totalAmount += Math.abs(transaction.amount);
      } else {
        regularTransactions.push(transaction);
      }
    });

    return {
      installmentGroups: Array.from(installmentGroups.values()),
      regularTransactions,
    };
  }

  function toggleInstallmentExpansion(installmentId: number) {
    setExpandedInstallments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(installmentId)) {
        newSet.delete(installmentId);
      } else {
        newSet.add(installmentId);
      }
      return newSet;
    });
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <TouchableOpacity onPress={() => showSnackbar('Detalhes da transação em desenvolvimento')}>
        <Card.Content style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <View style={[styles.transactionIcon, { backgroundColor: item.category.color }]}>
              <MaterialIcons name={item.category.icon as any} size={20} color="#fff" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>{item.description}</Text>
              <Text style={styles.transactionDetails}>
                {item.category.name} • {item.paymentMethod.name}
                {item.installment && ` • ${item.installment.currentInstallment}/${item.installment.installmentCount}`}
              </Text>
              <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              { color: item.type === 'INCOME' ? '#2e7d32' : '#d32f2f' }
            ]}>
              {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
            </Text>
            <Text style={styles.transactionType}>
              {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
            </Text>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header com busca */}
      <View style={styles.header}>
        <Title style={styles.title}>Transações</Title>
        <Searchbar
          placeholder="Buscar transações..."
          onChangeText={handleSearch}
          value={filters.search}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
        
        {/* Filtros ativos */}
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setFiltersVisible(true)}
            >
              <MaterialIcons name="tune" size={20} color="#2e7d32" />
              <Text style={styles.filterButtonText}>
                Filtros {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
              </Text>
            </TouchableOpacity>
            
            {activeFilters.type && (
              <Chip 
                style={styles.activeFilter}
                onClose={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters.type;
                  setActiveFilters(newFilters);
                  setFilters(newFilters);
                  loadTransactions(1, newFilters);
                }}
              >
                {activeFilters.type === 'INCOME' ? 'Receitas' : 'Despesas'}
              </Chip>
            )}
            
            {activeFilters.categoryId && (
              <Chip 
                style={styles.activeFilter}
                onClose={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters.categoryId;
                  setActiveFilters(newFilters);
                  setFilters(newFilters);
                  loadTransactions(1, newFilters);
                }}
              >
                {getCategoryName(activeFilters.categoryId)}
              </Chip>
            )}
            
            {activeFilters.paymentMethodId && (
              <Chip 
                style={styles.activeFilter}
                onClose={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters.paymentMethodId;
                  setActiveFilters(newFilters);
                  setFilters(newFilters);
                  loadTransactions(1, newFilters);
                }}
              >
                {getPaymentMethodName(activeFilters.paymentMethodId)}
              </Chip>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Lista de transações */}
      <FlatList
        data={(() => {
          const { installmentGroups, regularTransactions } = groupTransactions();
          return [
            ...installmentGroups.map(group => ({ type: 'installment', data: group })),
            ...regularTransactions.map(transaction => ({ type: 'transaction', data: transaction }))
          ];
        })()}
        renderItem={({ item }) => {
          if (item.type === 'installment') {
            return (
              <InstallmentCard
                group={item.data}
                onPress={() => showSnackbar('Detalhes da parcela em desenvolvimento')}
                onExpand={() => toggleInstallmentExpansion(item.data.installmentId)}
                isExpanded={expandedInstallments.has(item.data.installmentId)}
              />
            );
          } else {
            return renderTransaction({ item: item.data });
          }
        }}
        keyExtractor={(item) => 
          item.type === 'installment' 
            ? `installment-${item.data.installmentId}` 
            : `transaction-${item.data.id}`
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="receipt-long" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
              <Text style={styles.emptyText}>
                {activeFilters.search || getActiveFiltersCount() > 0
                  ? 'Tente ajustar os filtros de busca'
                  : 'Você ainda não possui transações cadastradas'
                }
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
        }
        ListFooterComponent={
          loading && transactions.length > 0 ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Carregando mais...</Text>
            </View>
          ) : null
        }
      />

      {/* Modal de filtros */}
      <Portal>
        <Modal
          visible={filtersVisible}
          onDismiss={() => setFiltersVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>Filtros</Title>
            
            {/* Tipo de transação */}
            <Text style={styles.filterLabel}>Tipo</Text>
            <View style={styles.typeFilters}>
              <Chip
                selected={filters.type === 'INCOME'}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  type: prev.type === 'INCOME' ? undefined : 'INCOME' 
                }))}
                style={styles.typeChip}
              >
                Receitas
              </Chip>
              <Chip
                selected={filters.type === 'EXPENSE'}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  type: prev.type === 'EXPENSE' ? undefined : 'EXPENSE' 
                }))}
                style={styles.typeChip}
              >
                Despesas
              </Chip>
            </View>

            {/* Categoria */}
            <Text style={styles.filterLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryFilters}>
                {categories.slice(0, 10).map(category => (
                  <Chip
                    key={category.id}
                    selected={filters.categoryId === category.id}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      categoryId: prev.categoryId === category.id ? undefined : category.id 
                    }))}
                    style={styles.categoryChip}
                  >
                    {category.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            {/* Método de pagamento */}
            <Text style={styles.filterLabel}>Método de Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.paymentFilters}>
                {paymentMethods.slice(0, 8).map(method => (
                  <Chip
                    key={method.id}
                    selected={filters.paymentMethodId === method.id}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      paymentMethodId: prev.paymentMethodId === method.id ? undefined : method.id 
                    }))}
                    style={styles.paymentChip}
                  >
                    {method.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>

            {/* Botões de ação */}
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={clearFilters}
                style={styles.modalButton}
              >
                Limpar
              </Button>
              <Button 
                mode="contained" 
                onPress={applyFilters}
                style={[styles.modalButton, styles.applyButton]}
              >
                Aplicar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f8f0',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#2e7d32',
    fontWeight: '500',
  },
  activeFilter: {
    marginRight: 8,
    backgroundColor: '#2e7d32',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  transactionDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    elevation: 2,
    borderRadius: 12,
    marginTop: 40,
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
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 16,
  },
  typeFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  typeChip: {
    flex: 1,
  },
  categoryFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  paymentFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentChip: {
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#2e7d32',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2e7d32',
  },
});
