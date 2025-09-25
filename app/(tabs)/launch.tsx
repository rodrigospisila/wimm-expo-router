import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { api, walletService, categoryService, transactionService } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
  subCategories: Category[];
}

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  creditLimit?: number;
  availableLimit?: number;
  color: string;
  icon: string;
  walletGroup?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
}

interface WalletGroup {
  id: number;
  name: string;
  color: string;
  icon: string;
  paymentMethods: PaymentMethod[];
}

export default function LaunchV2Screen() {
  const { theme, colors } = useTheme();
  const { getToken } = useAuth();
  
  // Estados do formulário
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [paymentForm, setPaymentForm] = useState<'CASH' | 'INSTALLMENT'>('CASH');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [notes, setNotes] = useState('');
  
  // Estados de seleção
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Estados dos modais
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  
  // Dados carregados
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletGroups, setWalletGroups] = useState<WalletGroup[]>([]);
  const [independentMethods, setIndependentMethods] = useState<PaymentMethod[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  // Estados de loading
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await categoryService.getCategories();
      
      // Organizar categorias com subcategorias
      const mainCategories = categoriesData.filter((cat: any) => !cat.parentCategoryId);
      const subcategories = categoriesData.filter((cat: any) => cat.parentCategoryId);
      
      const categoriesWithSubs = mainCategories.map((cat: any) => ({
        ...cat,
        subCategories: subcategories.filter((sub: any) => sub.parentCategoryId === cat.id),
      }));
      
      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoadingPaymentMethods(true);
      const [groups, allMethods] = await Promise.all([
        walletService.getGroups(),
        walletService.getPaymentMethods(),
      ]);
      
      setWalletGroups(groups);
      
      // Separar métodos independentes
      const independent = allMethods.filter((method: PaymentMethod) => !method.walletGroup);
      setIndependentMethods(independent);
      setPaymentMethods(allMethods);
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os métodos de pagamento');
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadPaymentMethods();
  }, [loadCategories, loadPaymentMethods]);

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleGroupExpansion = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const selectCategory = (category: Category, subcategory?: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || null);
    setShowCategoryModal(false);
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethodModal(false);
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const floatValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(floatValue || 0);
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatCurrency(text));
  };

  const getNumericAmount = () => {
    return parseFloat(amount.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
  };

  const calculateInstallmentValue = () => {
    const total = getNumericAmount();
    const count = parseInt(installmentCount) || 1;
    return total / count;
  };

  const handleSubmit = async () => {
    try {
      // Validações
      if (!description.trim()) {
        Alert.alert('Erro', 'Descrição é obrigatória');
        return;
      }
      
      if (getNumericAmount() <= 0) {
        Alert.alert('Erro', 'Valor deve ser maior que zero');
        return;
      }
      
      if (!selectedCategory) {
        Alert.alert('Erro', 'Categoria é obrigatória');
        return;
      }
      
      if (!selectedPaymentMethod) {
        Alert.alert('Erro', 'Método de pagamento é obrigatório');
        return;
      }

      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const transactionData = {
        description: description.trim(),
        amount: transactionType === 'EXPENSE' ? -getNumericAmount() : getNumericAmount(),
        date: new Date().toISOString(),
        type: transactionType,
        paymentMethodId: selectedPaymentMethod.id,
        categoryId: selectedSubcategory?.id || selectedCategory.id,
        subcategoryId: selectedSubcategory?.id || null,
        notes: notes.trim() || null,
      };

      if (paymentForm === 'INSTALLMENT') {
        // Criar parcela
        const installmentData = {
          description: description.trim(),
          totalAmount: getNumericAmount(),
          installmentCount: parseInt(installmentCount),
          paymentMethodId: selectedPaymentMethod.id,
          categoryId: selectedSubcategory?.id || selectedCategory.id,
          subcategoryId: selectedSubcategory?.id || null,
          startDate: new Date().toISOString(),
          installmentType: selectedPaymentMethod.type === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'FIXED',
          notes: notes.trim() || null,
        };

        await transactionService.createTransaction(installmentData);
        
        Alert.alert('Sucesso', `Parcela criada com ${installmentCount}x de ${formatCurrency((getNumericAmount() * 100).toString())}`);
      } else {
        // Criar transação à vista
        await transactionService.createTransaction(transactionData);
        
        Alert.alert('Sucesso', 'Transação criada com sucesso!');
      }

      // Resetar formulário
      resetForm();
      
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      Alert.alert('Erro', 'Não foi possível criar a transação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setInstallmentCount('1');
    setNotes('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedPaymentMethod(null);
  };

  const getPaymentMethodIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      CREDIT_CARD: 'card',
      DEBIT_CARD: 'card-outline',
      WALLET_BALANCE: 'wallet',
      PIX: 'flash',
      CHECKING_ACCOUNT: 'business',
      SAVINGS_ACCOUNT: 'piggy-bank',
      CASH: 'cash',
      INVESTMENT: 'trending-up',
      OTHER: 'ellipsis-horizontal',
    };
    return iconMap[type] || 'card';
  };

  const styles = getStyles(theme, colors);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tipo de Transação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Transação</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'INCOME' && styles.toggleButtonActive,
              ]}
              onPress={() => setTransactionType('INCOME')}
            >
              <Ionicons
                name="trending-up"
                size={20}
                color={transactionType === 'INCOME' ? 'white' : colors.success}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  transactionType === 'INCOME' && styles.toggleButtonTextActive,
                ]}
              >
                Receita
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'EXPENSE' && styles.toggleButtonActive,
              ]}
              onPress={() => setTransactionType('EXPENSE')}
            >
              <Ionicons
                name="trending-down"
                size={20}
                color={transactionType === 'EXPENSE' ? 'white' : colors.error}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  transactionType === 'EXPENSE' && styles.toggleButtonTextActive,
                ]}
              >
                Despesa
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forma de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                paymentForm === 'CASH' && styles.toggleButtonActive,
              ]}
              onPress={() => setPaymentForm('CASH')}
            >
              <Ionicons
                name="flash"
                size={20}
                color={paymentForm === 'CASH' ? 'white' : colors.primary}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  paymentForm === 'CASH' && styles.toggleButtonTextActive,
                ]}
              >
                À Vista
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                paymentForm === 'INSTALLMENT' && styles.toggleButtonActive,
              ]}
              onPress={() => setPaymentForm('INSTALLMENT')}
            >
              <Ionicons
                name="card"
                size={20}
                color={paymentForm === 'INSTALLMENT' ? 'white' : colors.primary}
              />
              <Text
                style={[
                  styles.toggleButtonText,
                  paymentForm === 'INSTALLMENT' && styles.toggleButtonTextActive,
                ]}
              >
                Parcelado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Almoço no restaurante"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Valor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor *</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
          />
          {paymentForm === 'INSTALLMENT' && amount && (
            <Text style={styles.installmentPreview}>
              {installmentCount}x de {formatCurrency((calculateInstallmentValue() * 100).toString())}
            </Text>
          )}
        </View>

        {/* Número de Parcelas */}
        {paymentForm === 'INSTALLMENT' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Número de Parcelas</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={installmentCount}
              onChangeText={setInstallmentCount}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        )}

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedItem}>
                <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                  <Ionicons name={selectedCategory.icon as any} size={16} color="white" />
                </View>
                <View style={styles.selectedItemText}>
                  <Text style={styles.selectedItemName}>
                    {selectedCategory.name}
                    {selectedSubcategory && ` → ${selectedSubcategory.name}`}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Selecionar categoria</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Método de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origem do Dinheiro *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowPaymentMethodModal(true)}
          >
            {selectedPaymentMethod ? (
              <View style={styles.selectedItem}>
                <View style={styles.paymentMethodInfo}>
                  <Ionicons
                    name={getPaymentMethodIcon(selectedPaymentMethod.type) as any}
                    size={20}
                    color={selectedPaymentMethod.color}
                  />
                  <View style={styles.selectedItemText}>
                    <Text style={styles.selectedItemName}>
                      {selectedPaymentMethod.walletGroup?.name && 
                        `${selectedPaymentMethod.walletGroup.name} → `}
                      {selectedPaymentMethod.name}
                    </Text>
                    <Text style={styles.selectedItemBalance}>
                      Saldo: {formatCurrency((selectedPaymentMethod.currentBalance * 100).toString())}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Selecionar origem</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observações adicionais (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : paymentForm === 'INSTALLMENT' ? 'Criar Parcela' : 'Salvar Transação'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de Categoria */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories.filter(cat => cat.type === transactionType)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item: category }) => (
                <View>
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => {
                      if (category.subCategories.length > 0) {
                        toggleCategoryExpansion(category.id);
                      } else {
                        selectCategory(category);
                      }
                    }}
                  >
                    <View style={styles.categoryItemContent}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={16} color="white" />
                      </View>
                      <Text style={styles.categoryItemName}>{category.name}</Text>
                      {category.subCategories.length > 0 && (
                        <Text style={styles.subcategoryCount}>
                          {category.subCategories.length} subcategorias
                        </Text>
                      )}
                    </View>
                    {category.subCategories.length > 0 && (
                      <Ionicons
                        name={expandedCategories.has(category.id) ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  
                  {expandedCategories.has(category.id) && (
                    <View style={styles.subcategoriesContainer}>
                      <TouchableOpacity
                        style={styles.subcategoryItem}
                        onPress={() => selectCategory(category)}
                      >
                        <Text style={styles.subcategoryItemName}>
                          {category.name} (categoria principal)
                        </Text>
                      </TouchableOpacity>
                      {category.subCategories.map((subcategory) => (
                        <TouchableOpacity
                          key={subcategory.id}
                          style={styles.subcategoryItem}
                          onPress={() => selectCategory(category, subcategory)}
                        >
                          <View style={[styles.subcategoryIcon, { backgroundColor: subcategory.color }]}>
                            <Ionicons name={subcategory.icon as any} size={12} color="white" />
                          </View>
                          <Text style={styles.subcategoryItemName}>{subcategory.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Método de Pagamento */}
      <Modal visible={showPaymentMethodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Origem</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {/* Grupos de Carteiras */}
              {walletGroups.map((group) => (
                <View key={group.id} style={styles.groupContainer}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroupExpansion(group.id)}
                  >
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                        <Ionicons name={group.icon as any} size={20} color="white" />
                      </View>
                      <Text style={styles.groupName}>{group.name}</Text>
                    </View>
                    <Ionicons
                      name={expandedGroups.has(group.id) ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  
                  {expandedGroups.has(group.id) && (
                    <View style={styles.paymentMethodsContainer}>
                      {group.paymentMethods.map((method) => (
                        <TouchableOpacity
                          key={method.id}
                          style={styles.paymentMethodItem}
                          onPress={() => selectPaymentMethod(method)}
                        >
                          <Ionicons
                            name={getPaymentMethodIcon(method.type) as any}
                            size={20}
                            color={method.color}
                          />
                          <View style={styles.paymentMethodDetails}>
                            <Text style={styles.paymentMethodName}>{method.name}</Text>
                            <Text style={styles.paymentMethodBalance}>
                              {formatCurrency((method.currentBalance * 100).toString())}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {/* Métodos Independentes */}
              {independentMethods.length > 0 && (
                <View style={styles.groupContainer}>
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupIcon, { backgroundColor: colors.textSecondary }]}>
                        <Ionicons name="wallet" size={20} color="white" />
                      </View>
                      <Text style={styles.groupName}>Contas Independentes</Text>
                    </View>
                  </View>
                  
                  <View style={styles.paymentMethodsContainer}>
                    {independentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={styles.paymentMethodItem}
                        onPress={() => selectPaymentMethod(method)}
                      >
                        <Ionicons
                          name={getPaymentMethodIcon(method.type) as any}
                          size={20}
                          color={method.color}
                        />
                        <View style={styles.paymentMethodDetails}>
                          <Text style={styles.paymentMethodName}>{method.name}</Text>
                          <Text style={styles.paymentMethodBalance}>
                            {formatCurrency((method.currentBalance * 100).toString())}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  installmentPreview: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  selector: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedItemName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedItemBalance: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemName: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  subcategoryCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  subcategoriesContainer: {
    backgroundColor: colors.background,
    paddingLeft: 20,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subcategoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategoryItemName: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
  groupContainer: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  paymentMethodsContainer: {
    paddingLeft: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  paymentMethodBalance: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
