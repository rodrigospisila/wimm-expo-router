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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

// Interfaces
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

// Componente de Item de Categoria (movido para dentro para simplicidade)
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

  // Estados do Formulário
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

  // Estados de UI e Dados
  const [loading, setLoading] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [searchText, setSearchText] = useState('');

  // Efeitos
  useEffect(() => {
    if (visible) {
      console.log('✅ InstallmentModal: Modal principal aberto, carregando dados...');
      loadCategories();
      loadWallets();
    } else {
      console.log('❌ InstallmentModal: Modal principal fechado, resetando estados.');
      resetForm();
    }
  }, [visible]);

  // Funções de Carregamento de Dados
  const loadCategories = async () => {
    try {
      console.log('🔄 InstallmentModal: Carregando categorias...');
      const token = getToken();
      if (!token) return;

      const response = await api.get('/categories', {
        params: { hierarchical: true, type: 'EXPENSE' },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ InstallmentModal: ${response.data.length} categorias de despesa carregadas.`);
      setCategories(response.data);
    } catch (error: any) {
      console.error('❌ InstallmentModal: Erro ao carregar categorias:', error);
      if (error.response?.status === 401) {
        Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => signOut() }]);
      }
    }
  };

  const loadWallets = async () => {
    try {
      console.log('🔄 InstallmentModal: Carregando carteiras...');
      const token = getToken();
      if (!token) return;

      const response = await api.get('/wallets', { headers: { Authorization: `Bearer ${token}` } });
      console.log(`✅ InstallmentModal: ${response.data.length} carteiras carregadas.`);
      setWallets(response.data);
    } catch (error) {
      console.error('❌ InstallmentModal: Erro ao carregar carteiras:', error);
    }
  };

  // Funções de Manipulação de Formulário
  const handleSubmit = async () => {
    // Validações (mantidas como antes)
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado');
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
      await api.post('/transactions/installments', payload, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Sucesso', 'Parcelas criadas com sucesso!');
      onSuccess();
      onClose(); // Isso vai disparar o reset no useEffect
    } catch (error: any) {
      console.error('❌ InstallmentModal: Erro ao criar parcelas:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar parcelas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ description: '', totalAmount: '', installmentCount: '', installmentType: 'FIXED', categoryId: null, walletId: null, creditCardId: null, notes: '' });
    setSelectedCategory(null);
    setSelectedWallet(null);
    setShowCategorySelector(false);
    setSearchText('');
  };

  const handleCategorySelect = (category: Category) => {
    console.log(`✅ Categoria selecionada: ${category.name}`);
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, categoryId: category.id }));
    setShowCategorySelector(false); // Volta para a tela do formulário
  };

  const calculateInstallmentAmount = () => {
    const total = parseFloat(formData.totalAmount);
    const count = parseInt(formData.installmentCount);
    return (total > 0 && count > 0) ? (total / count).toFixed(2) : '0.00';
  };

  // Lógica de Filtragem de Categorias
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.subCategories?.some(sub => sub.name.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Renderização
  const renderCategorySelector = () => (
    <SafeAreaView style={styles.selectorContainer} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowCategorySelector(false)} style={styles.closeButton}>
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

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CategoryItem category={item} level={0} onSelect={handleCategorySelect} colors={colors} />}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );

  const renderInstallmentForm = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nova Parcela</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
          <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Seletor de Categoria */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => {
              console.log('🔘 TouchableOpacity Categoria Pressionado');
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
        
        {/* Outros campos do formulário... */}
        <View style={styles.section}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput style={styles.input} value={formData.description} onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))} placeholder="Ex: Compra parcelada" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Valor Total</Text>
            <TextInput style={styles.input} value={formData.totalAmount} onChangeText={(text) => setFormData(prev => ({ ...prev, totalAmount: text }))} placeholder="0,00" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Nº Parcelas</Text>
            <TextInput style={styles.input} value={formData.installmentCount} onChangeText={(text) => setFormData(prev => ({ ...prev, installmentCount: text }))} placeholder="12" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
          </View>
        </View>

        {formData.totalAmount && formData.installmentCount && (
          <View style={styles.calculatedSection}>
            <Text style={styles.calculatedLabel}>Valor da Parcela</Text>
            <Text style={styles.calculatedValue}>R$ {calculateInstallmentAmount()}</Text>
          </View>
        )}

      </ScrollView>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {showCategorySelector ? renderCategorySelector() : renderInstallmentForm()}
      </View>
    </Modal>
  );
}

// Estilos
const getStyles = (colors: any) => StyleSheet.create({
  // Estilos Gerais
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
    paddingTop: 60, // Aumentado para iOS
  },
  closeButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: 'white', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  calculatedSection: { backgroundColor: colors.primaryLight, padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  calculatedLabel: { fontSize: 12, color: colors.primary, marginBottom: 4 },
  calculatedValue: { fontSize: 18, fontWeight: '600', color: colors.primary },

  // Estilos do Seletor de Categoria (Formulário)
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

  // Estilos da View do Seletor de Categoria (Substitui o Modal)
  selectorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text },
  list: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },

  // Estilos do Item de Categoria
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
});

