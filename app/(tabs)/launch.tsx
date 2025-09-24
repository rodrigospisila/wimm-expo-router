import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/contexts/AuthContext';
import api from '../../src/services/api';

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
  subCategories?: Category[];
}

interface Wallet {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
  currentBalance: number;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export default function LaunchScreen() {
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
  const { getToken, signOut } = useAuth();

  // Estados principais
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [paymentType, setPaymentType] = useState<'CASH' | 'INSTALLMENT'>('CASH');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD' | 'CASH' | 'TRANSFER'>('PIX');

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [notes, setNotes] = useState('');

  // Estados dos modais
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Dados
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadWallets();
  }, [transactionType, paymentMethod]);

  const loadCategories = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get(`/categories?type=${transactionType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadWallets = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Filtrar carteiras baseado no método de pagamento
      let walletType = '';
      if (paymentMethod === 'CARD') {
        walletType = 'CREDIT_CARD';
      } else if (paymentMethod === 'PIX' || paymentMethod === 'CASH') {
        walletType = 'ALL';
      }

      const response = await api.get(`/wallets${walletType !== 'ALL' ? `?type=${walletType}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filteredWallets = walletType === 'ALL' 
        ? response.data.filter((w: Wallet) => w.type !== 'CREDIT_CARD')
        : response.data;

      setWallets(filteredWallets);
      
      // Reset da carteira selecionada se não estiver na lista
      if (selectedWallet && !filteredWallets.find((w: Wallet) => w.id === selectedWallet.id)) {
        setSelectedWallet(null);
      }
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validações
      if (!description.trim()) {
        Alert.alert('Erro', 'Descrição é obrigatória');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Erro', 'Valor deve ser maior que zero');
        return;
      }

      if (!selectedCategory) {
        Alert.alert('Erro', 'Categoria é obrigatória');
        return;
      }

      if (!selectedWallet) {
        Alert.alert('Erro', 'Carteira/Cartão é obrigatório');
        return;
      }

      if (paymentType === 'INSTALLMENT' && (!installmentCount || parseInt(installmentCount) < 2)) {
        Alert.alert('Erro', 'Número de parcelas deve ser maior que 1');
        return;
      }

      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const transactionData = {
        description: description.trim(),
        amount: parseFloat(amount) * (transactionType === 'EXPENSE' ? -1 : 1),
        categoryId: selectedCategory.id,
        walletId: selectedWallet.id,
        notes: notes.trim() || undefined,
        type: transactionType,
      };

      let endpoint = '';
      let data: any = transactionData;

      if (paymentType === 'INSTALLMENT') {
        // Criar parcela
        endpoint = '/transactions/installments';
        data = {
          ...transactionData,
          totalAmount: Math.abs(parseFloat(amount)),
          installmentCount: parseInt(installmentCount),
          installmentType: paymentMethod === 'CARD' ? 'CREDIT_CARD' : 'FIXED',
        };
      } else {
        // Criar transação simples
        endpoint = '/transactions';
      }

      await api.post(endpoint, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Sucesso', `${paymentType === 'INSTALLMENT' ? 'Parcela' : 'Transação'} criada com sucesso!`);
      
      // Reset do formulário
      resetForm();

    } catch (error: any) {
      console.error('Erro ao criar lançamento:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setInstallmentCount('1');
    setSelectedCategory(null);
    setSelectedWallet(null);
    setNotes('');
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderCategorySelector = () => (
    <Modal
      visible={showCategorySelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecionar Categoria</Text>
          <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {categories.map((category) => (
            <View key={category.id}>
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === category.id && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategorySelector(false);
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={20} color="white" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                {selectedCategory?.id === category.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Subcategorias */}
              {category.subCategories?.map((subCategory) => (
                <TouchableOpacity
                  key={subCategory.id}
                  style={[
                    styles.subCategoryItem,
                    selectedCategory?.id === subCategory.id && styles.categoryItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategory(subCategory);
                    setShowCategorySelector(false);
                  }}
                >
                  <View style={[styles.subCategoryIcon, { backgroundColor: subCategory.color }]}>
                    <Ionicons name={subCategory.icon as any} size={16} color="white" />
                  </View>
                  <Text style={styles.subCategoryName}>{subCategory.name}</Text>
                  {selectedCategory?.id === subCategory.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderWalletSelector = () => (
    <Modal
      visible={showWalletSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Selecionar {paymentMethod === 'CARD' ? 'Cartão' : 'Carteira'}
          </Text>
          <TouchableOpacity onPress={() => setShowWalletSelector(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletItem,
                selectedWallet?.id === wallet.id && styles.walletItemSelected
              ]}
              onPress={() => {
                setSelectedWallet(wallet);
                setShowWalletSelector(false);
              }}
            >
              <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                <Ionicons name={wallet.icon as any} size={20} color="white" />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletBalance}>
                  {wallet.type === 'CREDIT_CARD' && wallet.creditLimit
                    ? `Limite: ${formatCurrency((wallet.creditLimit * 100).toString())}`
                    : `Saldo: ${formatCurrency((wallet.currentBalance * 100).toString())}`
                  }
                </Text>
              </View>
              {selectedWallet?.id === wallet.id && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tipo de Transação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Transação</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'INCOME' && styles.toggleButtonActive
              ]}
              onPress={() => setTransactionType('INCOME')}
            >
              <Ionicons 
                name="arrow-up" 
                size={20} 
                color={transactionType === 'INCOME' ? 'white' : colors.textSecondary} 
              />
              <Text style={[
                styles.toggleButtonText,
                transactionType === 'INCOME' && styles.toggleButtonTextActive
              ]}>
                Receita
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'EXPENSE' && styles.toggleButtonActive
              ]}
              onPress={() => setTransactionType('EXPENSE')}
            >
              <Ionicons 
                name="arrow-down" 
                size={20} 
                color={transactionType === 'EXPENSE' ? 'white' : colors.textSecondary} 
              />
              <Text style={[
                styles.toggleButtonText,
                transactionType === 'EXPENSE' && styles.toggleButtonTextActive
              ]}>
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
                paymentType === 'CASH' && styles.toggleButtonActive
              ]}
              onPress={() => setPaymentType('CASH')}
            >
              <Ionicons 
                name="flash" 
                size={20} 
                color={paymentType === 'CASH' ? 'white' : colors.textSecondary} 
              />
              <Text style={[
                styles.toggleButtonText,
                paymentType === 'CASH' && styles.toggleButtonTextActive
              ]}>
                À Vista
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                paymentType === 'INSTALLMENT' && styles.toggleButtonActive
              ]}
              onPress={() => setPaymentType('INSTALLMENT')}
            >
              <Ionicons 
                name="card" 
                size={20} 
                color={paymentType === 'INSTALLMENT' ? 'white' : colors.textSecondary} 
              />
              <Text style={[
                styles.toggleButtonText,
                paymentType === 'INSTALLMENT' && styles.toggleButtonTextActive
              ]}>
                Parcelado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Método de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método</Text>
          <View style={styles.methodContainer}>
            {['PIX', 'CARD', 'CASH'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodButton,
                  paymentMethod === method && styles.methodButtonActive
                ]}
                onPress={() => setPaymentMethod(method as any)}
              >
                <Ionicons 
                  name={
                    method === 'PIX' ? 'flash' : 
                    method === 'CARD' ? 'card' : 'cash'
                  } 
                  size={20} 
                  color={paymentMethod === method ? 'white' : colors.textSecondary} 
                />
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === method && styles.methodButtonTextActive
                ]}>
                  {method === 'PIX' ? 'PIX' : method === 'CARD' ? 'Cartão' : 'Dinheiro'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição *</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Almoço no restaurante"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Valor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor *</Text>
          <TextInput
            style={styles.textInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        {/* Número de Parcelas (se parcelado) */}
        {paymentType === 'INSTALLMENT' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Número de Parcelas *</Text>
            <TextInput
              style={styles.textInput}
              value={installmentCount}
              onChangeText={setInstallmentCount}
              placeholder="Ex: 12"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            {amount && installmentCount && parseInt(installmentCount) > 1 && (
              <Text style={styles.installmentInfo}>
                {parseInt(installmentCount)}x de {formatCurrency(((parseFloat(amount) || 0) / parseInt(installmentCount) * 100).toString())}
              </Text>
            )}
          </View>
        )}

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCategorySelector(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedItem}>
                <View style={[styles.selectedIcon, { backgroundColor: selectedCategory.color }]}>
                  <Ionicons name={selectedCategory.icon as any} size={16} color="white" />
                </View>
                <Text style={styles.selectedText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Selecionar categoria</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Carteira/Cartão */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {paymentMethod === 'CARD' ? 'Cartão *' : 'Carteira *'}
          </Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowWalletSelector(true)}
          >
            {selectedWallet ? (
              <View style={styles.selectedItem}>
                <View style={[styles.selectedIcon, { backgroundColor: selectedWallet.color }]}>
                  <Ionicons name={selectedWallet.icon as any} size={16} color="white" />
                </View>
                <Text style={styles.selectedText}>{selectedWallet.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>
                Selecionar {paymentMethod === 'CARD' ? 'cartão' : 'carteira'}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observações adicionais (opcional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : `Salvar ${paymentType === 'INSTALLMENT' ? 'Parcela' : 'Transação'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {renderCategorySelector()}
      {renderWalletSelector()}
    </View>
  );
}

const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
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
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  methodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    gap: 6,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
  },
  methodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  methodButtonTextActive: {
    color: 'white',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  installmentInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  selector: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    gap: 12,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: colors.surface,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  subCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 32,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  subCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCategoryName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  walletItemSelected: {
    backgroundColor: colors.surface,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  walletBalance: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
