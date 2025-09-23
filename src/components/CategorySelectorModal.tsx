import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  color: string;
  icon: string;
  monthlyBudget?: number;
  parentCategoryId?: number;
  parentCategory?: Category;
  subCategories: Category[];
  _count: {
    transactions: number;
  };
}

interface CategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
  type: 'INCOME' | 'EXPENSE';
}

interface CategoryItemProps {
  category: Category;
  level: number;
  onSelect: (category: Category) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  onSelect,
}) => {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    onSelect(category);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const styles = getStyles(colors);

  return (
    <View>
      <View style={[styles.categoryItem, { paddingLeft: 16 + (level * 20) }]}>
        <TouchableOpacity
          style={styles.categoryContent}
          onPress={handlePress}
        >
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon as any} size={16} color="white" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryDescription}>{category.description}</Text>
            )}
          </View>
        </TouchableOpacity>
        
        {category.subCategories && category.subCategories.length > 0 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}
          >
            <Ionicons
              name={expanded ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {expanded && category.subCategories && (
        <View>
          {category.subCategories.map((subcategory) => (
            <CategoryItem
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  type,
}) => {
  const colors = useTheme();
  const { getToken, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    console.log('🔄 CategorySelectorModal: useEffect disparado');
    console.log('👁️ CategorySelectorModal: visible:', visible);
    console.log('📊 CategorySelectorModal: type:', type);
    
    if (visible) {
      console.log('✅ CategorySelectorModal: Modal visível, carregando categorias...');
      loadCategories();
    } else {
      console.log('❌ CategorySelectorModal: Modal não visível, não carregando');
    }
  }, [visible, type]);

  const loadCategories = async () => {
    try {
      console.log('🔄 CategorySelectorModal: Iniciando carregamento de categorias...');
      console.log('📊 CategorySelectorModal: Tipo solicitado:', type);
      
      setLoading(true);
      const token = await getToken();
      
      console.log('🔑 CategorySelectorModal: Token obtido:', token ? 'encontrado' : 'não encontrado');
      
      if (!token) {
        console.log('❌ CategorySelectorModal: Token não encontrado');
        Alert.alert('Erro', 'Token de autenticação não encontrado');
        return;
      }

      console.log('🌐 CategorySelectorModal: Fazendo requisição para /categories');
      const response = await api.get('/categories', {
        params: {
          hierarchical: true,
          type: type,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ CategorySelectorModal: Resposta recebida:', response.data.length, 'categorias');
      console.log('📋 CategorySelectorModal: Categorias:', response.data);
      
      setCategories(response.data);
    } catch (error: any) {
      console.error('❌ CategorySelectorModal: Erro ao carregar categorias:', error);
      console.log('📊 CategorySelectorModal: Status do erro:', error.response?.status);
      console.log('📊 CategorySelectorModal: Dados do erro:', error.response?.data);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Faça login novamente.',
          [{ text: 'OK', onPress: () => signOut() }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as categorias');
      }
    } finally {
      console.log('🏁 CategorySelectorModal: Carregamento finalizado');
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    onSelect(category);
    onClose();
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.subCategories?.some(sub =>
      sub.name.toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const styles = getStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Selecionar Categoria</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
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

        {/* Categories List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando categorias...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma categoria disponível</Text>
            <Text style={styles.emptySubtext}>
              {type === 'EXPENSE' ? 'Nenhuma categoria de despesa encontrada' : 'Nenhuma categoria de receita encontrada'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <CategoryItem
                category={item}
                level={0}
                onSelect={handleCategorySelect}
              />
            )}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expandButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CategorySelectorModal;
