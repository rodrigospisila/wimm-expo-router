import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import CategorySelectorModal from './CategorySelectorModal';

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
}

interface Wallet {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  color: string;
  icon: string;
}

interface InstallmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InstallmentModal({ visible, onClose, onSuccess }: InstallmentModalProps) {
  const { getToken } = useAuth();
  const colors = useTheme();
  const styles = getStyles(colors);

  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    installmentCount: '',
    installmentType: 'FIXED' as 'FIXED' | 'CREDIT_CARD',
    categoryId: null as number | null,
    walletId: null as number | null,
    creditCardId: null as number | null,
    notes: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  // Log detalhado para monitorar mudanças no showCategorySelector
  useEffect(() => {
    console.log('🔄 InstallmentModal: showCategorySelector mudou para:', showCategorySelector);
    console.log('📊 InstallmentModal: Timestamp:', new Date().toISOString());
    console.log('📊 InstallmentModal: Stack trace:', new Error().stack);
  }, [showCategorySelector]);

  // Log para monitorar quando o modal principal fica visível
  useEffect(() => {
    console.log('🔄 InstallmentModal: Modal principal visible mudou para:', visible);
    if (visible) {
      console.log('✅ InstallmentModal: Modal principal aberto, carregando dados...');
      loadCategories();
      loadWallets();
    } else {
      console.log('❌ InstallmentModal: Modal principal fechado');
      // Reset do estado quando o modal é fechado
      setShowCategorySelector(false);
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      console.log('🔄 InstallmentModal: Iniciando carregamento de categorias...');
      const token = getToken();
      if (!token) {
        console.log('❌ InstallmentModal: Token não encontrado');
        return;
      }

      console.log('🌐 InstallmentModal: Fazendo requisição para /categories');
      const response = await api.get('/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const expenseCategories = response.data.filter((cat: Category) => cat.type === 'EXPENSE');
      console.log('✅ InstallmentModal: Categorias carregadas:', expenseCategories.length);
      setCategories(expenseCategories);
    } catch (error) {
      console.error('❌ InstallmentModal: Erro ao carregar categorias:', error);
    }
  };

  const loadWallets = async () => {
    try {
      console.log('🔄 InstallmentModal: Iniciando carregamento de carteiras...');
      const token = getToken();
      if (!token) {
        console.log('❌ InstallmentModal: Token não encontrado para carteiras');
        return;
      }

      console.log('🌐 InstallmentModal: Fazendo requisição para /wallets');
      const response = await api.get('/wallets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('✅ InstallmentModal: Carteiras carregadas:', response.data.length);
      setWallets(response.data);
    } catch (error) {
      console.error('❌ InstallmentModal: Erro ao carregar carteiras:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return;
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      Alert.alert('Erro', 'Valor total deve ser maior que zero');
      return;
    }

    if (!formData.installmentCount || parseInt(formData.installmentCount) <= 1) {
      Alert.alert('Erro', 'Número de parcelas deve ser maior que 1');
      return;
    }

    if (!formData.categoryId) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    if (formData.installmentType === 'FIXED' && !formData.walletId) {
      Alert.alert('Erro', 'Selecione uma carteira para parcelas fixas');
      return;
    }

    if (formData.installmentType === 'CREDIT_CARD' && !formData.creditCardId) {
      Alert.alert('Erro', 'Selecione um cartão de crédito');
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const payload = {
        description: formData.description.trim(),
        totalAmount: parseFloat(formData.totalAmount),
        installmentCount: parseInt(formData.installmentCount),
        installmentType: formData.installmentType,
        categoryId: formData.categoryId,
        ...(formData.walletId && { walletId: formData.walletId }),
        ...(formData.creditCardId && { creditCardId: formData.creditCardId }),
        ...(formData.notes && { notes: formData.notes.trim() }),
      };

      await api.post('/transactions/installments', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Sucesso', 'Parcelas criadas com sucesso!');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar parcelas:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar parcelas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      totalAmount: '',
      installmentCount: '',
      installmentType: 'FIXED',
      categoryId: null,
      walletId: null,
      creditCardId: null,
      notes: '',
    });
    setSelectedCategory(null);
    setSelectedWallet(null);
    setShowCategorySelector(false);
  };

  const handleCategorySelect = (category: Category) => {
    console.log('✅ InstallmentModal: Categoria selecionada:', category.name);
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, categoryId: category.id }));
    setShowCategorySelector(false);
    console.log('✅ InstallmentModal: Modal de categoria fechado após seleção');
  };

  const handleWalletSelect = (wallet: Wallet) => {
    console.log('✅ InstallmentModal: Carteira selecionada:', wallet.name);
    setSelectedWallet(wallet);
    setFormData(prev => ({ ...prev, walletId: wallet.id }));
  };

  const calculateInstallmentAmount = () => {
    if (formData.totalAmount && formData.installmentCount) {
      const total = parseFloat(formData.totalAmount);
      const count = parseInt(formData.installmentCount);
      if (total > 0 && count > 0) {
        return (total / count).toFixed(2);
      }
    }
    return '0.00';
  };

  // Função para abrir o modal de categoria com logs detalhados
  const openCategorySelector = () => {
    console.log('🔘 InstallmentModal: openCategorySelector chamada');
    console.log('📊 InstallmentModal: showCategorySelector antes:', showCategorySelector);
    console.log('📊 InstallmentModal: categories.length:', categories.length);
    console.log('📊 InstallmentModal: visible:', visible);
    
    if (categories.length === 0) {
      console.log('⚠️ InstallmentModal: Nenhuma categoria carregada, recarregando...');
      loadCategories();
    }
    
    setShowCategorySelector(true);
    console.log('✅ InstallmentModal: setShowCategorySelector(true) executado');
    
    // Verificação adicional após um pequeno delay
    setTimeout(() => {
      console.log('🔍 InstallmentModal: Verificação após 100ms - showCategorySelector:', showCategorySelector);
    }, 100);
  };

  // Função para fechar o modal de categoria
  const closeCategorySelector = () => {
    console.log('🔘 InstallmentModal: closeCategorySelector chamada');
    setShowCategorySelector(false);
    console.log('✅ InstallmentModal: setShowCategorySelector(false) executado');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Nova Parcela</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tipo de Parcela */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Parcela</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.installmentType === 'FIXED' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, installmentType: 'FIXED' }))}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={formData.installmentType === 'FIXED' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.installmentType === 'FIXED' && styles.typeButtonTextActive,
                    ]}
                  >
                    Parcela Fixa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.installmentType === 'CREDIT_CARD' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, installmentType: 'CREDIT_CARD' }))}
                >
                  <Ionicons
                    name="card"
                    size={20}
                    color={formData.installmentType === 'CREDIT_CARD' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.installmentType === 'CREDIT_CARD' && styles.typeButtonTextActive,
                    ]}
                  >
                    Cartão de Crédito
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Ex: Compra parcelada"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Valor Total e Parcelas */}
            <View style={styles.row}>
              <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Valor Total</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalAmount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, totalAmount: text }))}
                  placeholder="0,00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Nº Parcelas</Text>
                <TextInput
                  style={styles.input}
                  value={formData.installmentCount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, installmentCount: text }))}
                  placeholder="12"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Valor da Parcela (calculado) */}
            {formData.totalAmount && formData.installmentCount && (
              <View style={styles.calculatedSection}>
                <Text style={styles.calculatedLabel}>Valor da Parcela</Text>
                <Text style={styles.calculatedValue}>R$ {calculateInstallmentAmount()}</Text>
              </View>
            )}

            {/* Categoria */}
            <View style={styles.section}>
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  console.log('🔘 InstallmentModal: TouchableOpacity pressionado - DIRETO');
                  console.log('📊 InstallmentModal: showCategorySelector antes:', showCategorySelector);
                  console.log('📊 InstallmentModal: categories.length:', categories.length);
                  
                  if (categories.length === 0) {
                    console.log('⚠️ InstallmentModal: Recarregando categorias...');
                    loadCategories();
                  }
                  
                  setShowCategorySelector(true);
                  console.log('✅ InstallmentModal: setShowCategorySelector(true) executado DIRETO');
                }}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {selectedCategory ? (
                  <View style={styles.selectedItem}>
                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
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

            {/* Carteira (apenas para parcelas fixas) */}
            {formData.installmentType === 'FIXED' && (
              <View style={styles.section}>
                <Text style={styles.label}>Carteira</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.walletSelector}>
                    {wallets.map((wallet) => (
                      <TouchableOpacity
                        key={wallet.id}
                        style={[
                          styles.walletOption,
                          selectedWallet?.id === wallet.id && styles.walletOptionSelected,
                        ]}
                        onPress={() => handleWalletSelect(wallet)}
                      >
                        <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                          <Ionicons name={wallet.icon as any} size={16} color="white" />
                        </View>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletBalance}>
                          R$ {wallet.currentBalance.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Observações */}
            <View style={styles.section}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Adicione observações sobre esta parcela..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Seleção de Categoria */}
      <CategorySelectorModal
        visible={showCategorySelector}
        onClose={() => {
          console.log('🔘 InstallmentModal: Fechando modal de categoria - DIRETO');
          setShowCategorySelector(false);
          console.log('✅ InstallmentModal: setShowCategorySelector(false) executado DIRETO');
        }}
        onSelect={handleCategorySelect}
        type="EXPENSE"
      />
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
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
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  typeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  calculatedSection: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  calculatedLabel: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    minHeight: 56, // Aumentar área de toque para iOS
    elevation: 1, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 1 }, // iOS
    shadowOpacity: 0.1, // iOS
    shadowRadius: 2, // iOS
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: colors.text,
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  walletSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  walletOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 80,
  },
  walletOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  walletName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
