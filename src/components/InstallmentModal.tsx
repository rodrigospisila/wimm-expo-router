import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

// Interfaces completas
interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
  description?: string;
  subCategories: Category[];
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

const { height } = Dimensions.get('window');

// Componente de Item de Categoria
const getValidIconName = (iconName: string): any => {
  const iconMap: { [key: string]: string } = {
    'shopping-cart': 'cart',
    'account-balance': 'business',
    'movie': 'film',
    'more-horiz': 'ellipsis-horizontal',
    'local-hospital': 'medical',
    'directions-car': 'car',
    'build': 'construct',
    'school': 'school',
    'home': 'home',
    'restaurant': 'restaurant',
  };
  return iconMap[iconName] || iconName;
};

const CategoryItem: React.FC<{ category: Category; level: number; onSelect: (category: Category) => void; colors: any }> = ({ category, level, onSelect, colors }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = getStyles(colors);

  return (
    <View>
      <View style={[styles.categoryItem, { paddingLeft: 16 + (level * 20) }]}>
        <TouchableOpacity style={styles.categoryContent} onPress={() => onSelect(category)} activeOpacity={0.7}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Ionicons name={getValidIconName(category.icon)} size={16} color="white" />
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
        {category.subCategories && category.subCategories.length > 0 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
            <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {expanded && category.subCategories && (
        <View>
          {category.subCategories.map((sub) => (
            <CategoryItem key={sub.id} category={sub} level={level + 1} onSelect={onSelect} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
};

// Componente Principal
export default function InstallmentModal({ visible, onClose, onSuccess }: InstallmentModalProps) {
  const { getToken, signOut } = useAuth();
  const colors = useTheme();
  const styles = getStyles(colors);

  // Animação
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Estados do formulário
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

  // Estados de UI e dados
  const [loading, setLoading] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [searchText, setSearchText] = useState('');

  // Efeito para controlar a animação e o carregamento de dados
  useEffect(() => {
    if (visible) {
      console.log('✅ Modal aberto - carregando dados...');
      loadCategories();
      loadWallets();
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      console.log('❌ Modal fechado - iniciando animação de saída...');
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() => {
        resetForm();
      });
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.get('/categories', {
        params: { hierarchical: true, type: 'EXPENSE' },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ ${response.data.length} categorias carregadas`);
      setCategories(response.data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar categorias:', error);
      if (error.response?.status === 401) {
        Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => signOut() }]);
      }
    }
  };

  const loadWallets = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.get('/wallets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ ${response.data.length} carteiras carregadas`);
      setWallets(response.data);
    } catch (error) {
      console.error('❌ Erro ao carregar carteiras:', error);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => {
    // Validações
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
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao criar parcelas:', error);
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
    setSearchText('');
  };

  const handleCategorySelect = (category: Category) => {
    console.log(`✅ Categoria selecionada: ${category.name}`);
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, categoryId: category.id }));
    setShowCategorySelector(false);
  };

  const handleWalletSelect = (wallet: Wallet) => {
    console.log(`✅ Carteira selecionada: ${wallet.name}`);
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.subCategories?.some(sub => sub.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  if (!visible && slideAnim._value === height) {
    return null;
  }

  const renderCategorySelector = () => (
    <View style={styles.sheetContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowCategorySelector(false)} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Selecionar Categoria</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar categoria..."
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CategoryItem category={item} level={0} onSelect={handleCategorySelect} colors={colors} />}
        style={styles.list}
      />
    </View>
  );

  const renderInstallmentForm = () => (
    <View style={styles.sheetContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
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

      <KeyboardAwareScrollView style={styles.scrollView} enableOnAndroid={true} extraScrollHeight={20}>
        <View style={styles.content}>
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
                console.log('🔘 Botão categoria pressionado');
                setShowCategorySelector(true);
              }}
              activeOpacity={0.6}
            >
              {selectedCategory ? (
                <View style={styles.selectedItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                    <Ionicons name={getValidIconName(selectedCategory.icon)} size={16} color="white" />
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
        </View>
      </KeyboardAwareScrollView>
    </View>
  );

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.animatedContainer, { transform: [{ translateY: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          {showCategorySelector ? renderCategorySelector() : renderInstallmentForm()}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  animatedContainer: {
    width: '100%',
    height: '95%',
    maxHeight: height * 0.95,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 20,
  },
  headerButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  calculatedSection: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  calculatedLabel: { fontSize: 12, color: colors.primary, marginBottom: 4 },
  calculatedValue: { fontSize: 18, fontWeight: '600', color: colors.primary },
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
    minHeight: 56,
  },
  selectedItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedText: { fontSize: 16, color: colors.text },
  selectorPlaceholder: { fontSize: 16, color: colors.textSecondary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text, paddingVertical: 8 },
  list: { flex: 1 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '500', color: colors.text },
  expandButton: { padding: 8 },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: 8,
  },
  typeButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeButtonText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  typeButtonTextActive: { color: colors.primary },
  walletSelector: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  walletOption: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    minWidth: 100,
  },
  walletOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  walletIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  walletName: { fontSize: 12, fontWeight: '500', color: colors.text, textAlign: 'center', marginBottom: 4 },
  walletBalance: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
});
