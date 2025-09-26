import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { budgetService, categoryService } from '../../src/services/api';

interface Budget {
  id: number;
  monthlyLimit: number;
  currentSpent: number;
  percentage: number;
  remaining: number;
  status: 'ON_TRACK' | 'WARNING' | 'OVER_BUDGET';
  month: number;
  year: number;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  overBudgetCount: number;
  warningCount: number;
  onTrackCount: number;
}

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  // Estados do formulário
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBudgets(),
        loadSummary(),
        loadCategories(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados dos orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      const data = await budgetService.getBudgets(currentMonth, currentYear);
      setBudgets(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await budgetService.getBudgetSummary(currentMonth, currentYear);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      // Filtrar apenas categorias de despesa que não têm orçamento
      const expenseCategories = data.filter(cat => 
        cat.type === 'EXPENSE' && 
        !budgets.some(budget => budget.category.id === cat.id)
      );
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ON_TRACK': return '#4CAF50';
      case 'WARNING': return '#FF9800';
      case 'OVER_BUDGET': return '#F44336';
      default: return colors.text;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'ON_TRACK': return 'No controle';
      case 'WARNING': return 'Atenção';
      case 'OVER_BUDGET': return 'Estourado';
      default: return 'Desconhecido';
    }
  };

  const handleCreateBudget = async () => {
    if (!selectedCategoryId || !monthlyLimit) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await budgetService.createBudget({
        categoryId: selectedCategoryId,
        monthlyLimit: parseFloat(monthlyLimit),
        month: currentMonth,
        year: currentYear,
      });

      setShowCreateModal(false);
      setSelectedCategoryId(null);
      setMonthlyLimit('');
      await loadData();
      Alert.alert('Sucesso', 'Orçamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      Alert.alert('Erro', 'Não foi possível criar o orçamento');
    }
  };

  const handleEditBudget = async () => {
    if (!selectedBudget || !monthlyLimit) {
      Alert.alert('Erro', 'Preencha o limite mensal');
      return;
    }

    try {
      await budgetService.updateBudget(selectedBudget.id, {
        monthlyLimit: parseFloat(monthlyLimit),
      });

      setShowEditModal(false);
      setSelectedBudget(null);
      setMonthlyLimit('');
      await loadData();
      Alert.alert('Sucesso', 'Orçamento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o orçamento');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir o orçamento da categoria "${budget.category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetService.deleteBudget(budget.id);
              await loadData();
              Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir orçamento:', error);
              Alert.alert('Erro', 'Não foi possível excluir o orçamento');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setMonthlyLimit(budget.monthlyLimit.toString());
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Carregando orçamentos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Orçamentos
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Resumo */}
        {summary && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Resumo do Mês
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Orçamento Total
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(summary.totalBudget)}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Gasto Total
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Restante
                </Text>
                <Text style={[
                  styles.summaryValue,
                  { color: summary.totalRemaining >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {formatCurrency(summary.totalRemaining)}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Status
                </Text>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                    {summary.onTrackCount} OK
                  </Text>
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>
                    {summary.warningCount} Atenção
                  </Text>
                  <Text style={[styles.statusText, { color: '#F44336' }]}>
                    {summary.overBudgetCount} Estourado
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Orçamentos */}
        <View style={styles.budgetsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Orçamentos por Categoria
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {budgets.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nenhum orçamento criado
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Crie seu primeiro orçamento para controlar seus gastos
              </Text>
              <TouchableOpacity
                style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createFirstButtonText}>Criar Orçamento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            budgets.map((budget) => (
              <View key={budget.id} style={[styles.budgetCard, { backgroundColor: colors.surface }]}>
                <View style={styles.budgetHeader}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: budget.category.color + '20' }
                      ]}
                    >
                      <Ionicons
                        name={budget.category.icon as any}
                        size={20}
                        color={budget.category.color}
                      />
                    </View>
                    <View style={styles.categoryText}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {budget.category.name}
                      </Text>
                      <Text style={[styles.budgetStatus, { color: getStatusColor(budget.status) }]}>
                        {getStatusText(budget.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(budget)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteBudget(budget)}
                    >
                      <Ionicons name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.budgetProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {formatCurrency(budget.currentSpent)} de {formatCurrency(budget.monthlyLimit)}
                    </Text>
                    <Text style={[styles.progressPercentage, { color: getStatusColor(budget.status) }]}>
                      {budget.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(budget.percentage, 100)}%`,
                          backgroundColor: getStatusColor(budget.status),
                        }
                      ]}
                    />
                  </View>
                  
                  <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
                    {budget.remaining >= 0 ? 'Restam' : 'Excedeu'} {formatCurrency(Math.abs(budget.remaining))}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de Criação */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Novo Orçamento
            </Text>
            <TouchableOpacity onPress={handleCreateBudget}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Categoria *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoriesRow}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: selectedCategoryId === category.id
                            ? category.color + '20'
                            : colors.surface,
                          borderColor: selectedCategoryId === category.id
                            ? category.color
                            : colors.border,
                        }
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={20}
                        color={category.color}
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        { color: colors.text }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Limite Mensal *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                value={monthlyLimit}
                onChangeText={setMonthlyLimit}
                placeholder="Ex: 500.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Editar Orçamento
            </Text>
            <TouchableOpacity onPress={handleEditBudget}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>
                Salvar
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedBudget && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Categoria: {selectedBudget.category.name}
                </Text>
                <Text style={[styles.formLabel, { color: colors.text }]}>
                  Limite Mensal *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    }
                  ]}
                  value={monthlyLimit}
                  onChangeText={setMonthlyLimit}
                  placeholder="Ex: 500.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  summaryCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  budgetProgress: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    minWidth: 120,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
