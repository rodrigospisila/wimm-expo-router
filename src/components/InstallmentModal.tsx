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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

// Interfaces (mantidas)
interface Category { id: number; name: string; color: string; icon: string; subCategories: Category[]; }
interface Wallet { id: number; name: string; type: string; currentBalance: number; color: string; icon: string; }
interface InstallmentModalProps { visible: boolean; onClose: () => void; onSuccess: () => void; }

const { height } = Dimensions.get('window');

// Componente de Item de Categoria (mantido)
const getValidIconName = (iconName: string): any => {
  const iconMap: { [key: string]: string } = { 'shopping-cart': 'cart', 'account-balance': 'business', 'movie': 'film', 'more-horiz': 'ellipsis-horizontal', 'local-hospital': 'medical', 'directions-car': 'car', 'build': 'construct', 'school': 'school', 'home': 'home', 'restaurant': 'restaurant' };
  return iconMap[iconName] || iconName;
};

const CategoryItem: React.FC<{ category: Category; level: number; onSelect: (category: Category) => void; colors: any }> = ({ category, level, onSelect, colors }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = getStyles(colors);
  return (
    <View>
      <View style={[styles.categoryItem, { paddingLeft: 16 + (level * 20) }]}>
        <TouchableOpacity style={styles.categoryContent} onPress={() => onSelect(category)} activeOpacity={0.7}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><Ionicons name={getValidIconName(category.icon)} size={16} color="white" /></View>
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
        {category.subCategories && category.subCategories.length > 0 && (
          <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
            <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {expanded && category.subCategories && (
        <View>{category.subCategories.map((sub) => <CategoryItem key={sub.id} category={sub} level={level + 1} onSelect={onSelect} colors={colors} />)}</View>
      )}
    </View>
  );
};

// Componente Principal Refatorado
export default function InstallmentModal({ visible, onClose, onSuccess }: InstallmentModalProps) {
  const { getToken, signOut } = useAuth();
  const colors = useTheme();
  const styles = getStyles(colors);

  // Animação
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Estados
  const [formData, setFormData] = useState({ description: '', totalAmount: '', installmentCount: '', installmentType: 'FIXED' as 'FIXED' | 'CREDIT_CARD', categoryId: null as number | null, walletId: null as number | null, creditCardId: null as number | null, notes: '' });
  const [loading, setLoading] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState('');

  // Efeito para controlar a animação e o carregamento de dados
  useEffect(() => {
    if (visible) {
      console.log('MODAL VISÍVEL - Iniciando animação de subida.');
      loadData();
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      console.log('MODAL OCULTO - Iniciando animação de descida.');
      Animated.timing(slideAnim, { toValue: height, duration: 300, useNativeDriver: true }).start(() => {
        resetForm(); // Reseta o formulário após a animação de saída
      });
    }
  }, [visible]);

  const loadData = () => {
    loadCategories();
    // loadWallets(); // Descomente se necessário
  };

  const loadCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await api.get('/categories', { params: { hierarchical: true, type: 'EXPENSE' }, headers: { Authorization: `Bearer ${token}` } });
      setCategories(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => signOut() }]);
      }
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = async () => { /* ... (mantido) ... */ };
  const resetForm = () => {
    setFormData({ description: '', totalAmount: '', installmentCount: '', installmentType: 'FIXED', categoryId: null, walletId: null, creditCardId: null, notes: '' });
    setSelectedCategory(null);
    setShowCategorySelector(false);
    setSearchText('');
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, categoryId: category.id }));
    setShowCategorySelector(false);
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchText.toLowerCase()));

  if (!visible && slideAnim._value === height) {
    return null; // Não renderiza nada se não estiver visível e a animação tiver terminado
  }

  const renderCategorySelector = () => (
    <View style={styles.sheetContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowCategorySelector(false)} style={styles.headerButton}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Selecionar Categoria</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.searchContainer}><Ionicons name="search" size={20} color={colors.textSecondary} /><TextInput style={styles.searchInput} placeholder="Buscar..." value={searchText} onChangeText={setSearchText} /></View>
      <FlatList data={filteredCategories} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => <CategoryItem category={item} level={0} onSelect={handleCategorySelect} colors={colors} />} />
    </View>
  );

  const renderInstallmentForm = () => (
    <View style={styles.sheetContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Nova Parcela</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar</Text></TouchableOpacity>
      </View>
      <KeyboardAwareScrollView>
        <View style={styles.content}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity style={styles.selector} onPress={() => { console.log('--- BOTÃO CATEGORIA PRESSIONADO ---'); setShowCategorySelector(true); }}>
            {selectedCategory ? <Text style={styles.selectorText}>{selectedCategory.name}</Text> : <Text style={styles.selectorPlaceholder}>Selecionar categoria</Text>}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {/* Outros campos do formulário aqui */}
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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  animatedContainer: { width: '100%', height: '95%', maxHeight: height * 0.95, backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  sheetContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 20 },
  headerButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { color: 'white', fontWeight: '600' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, backgroundColor: colors.surface, minHeight: 56 },
  selectorText: { fontSize: 16, color: colors.text },
  selectorPlaceholder: { fontSize: 16, color: colors.textSecondary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text, paddingVertical: 8 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingLeft: 16 },
  categoryContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '500', color: colors.text },
  expandButton: { padding: 8 },
});

