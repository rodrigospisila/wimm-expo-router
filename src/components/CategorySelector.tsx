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
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

interface CategorySelectorProps {
  selectedCategoryId?: number;
  onCategorySelect: (category: Category | null) => void;
  transactionType?: 'INCOME' | 'EXPENSE';
  placeholder?: string;
  disabled?: boolean;
}

interface CategoryItemProps {
  category: Category;
  level: number;
  onSelect: (category: Category) => void;
  selectedId?: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  onSelect,
  selectedId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubcategories = category.subCategories && category.subCategories.length > 0;
  const isSelected = selectedId === category.id;
  const indentWidth = level * 20;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { marginLeft: indentWidth },
          isSelected && styles.selectedCategoryItem,
        ]}
        onPress={() => onSelect(category)}
      >
        {/* Botão de expansão */}
        {hasSubcategories && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color="#666"
            />
          </TouchableOpacity>
        )}

        {/* Ícone da categoria */}
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <Ionicons name={category.icon as any} size={18} color="white" />
        </View>

        {/* Nome da categoria */}
        <Text style={[styles.categoryName, isSelected && styles.selectedCategoryName]}>
          {category.name}
        </Text>

        {/* Indicador de seleção */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
        )}
      </TouchableOpacity>

      {/* Subcategorias */}
      {hasSubcategories && isExpanded && (
        <View>
          {category.subCategories.map((subcategory) => (
            <CategoryItem
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  transactionType,
  placeholder = 'Selecionar categoria',
  disabled = false,
}) => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (modalVisible) {
      loadCategories();
    }
  }, [modalVisible, transactionType]);

  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = findCategoryById(categories, selectedCategoryId);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [selectedCategoryId, categories]);

  const findCategoryById = (categoryList: Category[], id: number): Category | null => {
    for (const category of categoryList) {
      if (category.id === id) {
        return category;
      }
      if (category.subCategories) {
        const found = findCategoryById(category.subCategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('hierarchical', 'true');
      
      if (transactionType) {
        params.append('type', transactionType);
      }

      const response = await api.get(`/categories?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = (categoryList: Category[], searchTerm: string): Category[] => {
    if (!searchTerm) return categoryList;

    const filtered: Category[] = [];
    
    for (const category of categoryList) {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const filteredSubcategories = category.subCategories 
        ? filterCategories(category.subCategories, searchTerm)
        : [];

      if (matchesSearch || filteredSubcategories.length > 0) {
        filtered.push({
          ...category,
          subCategories: filteredSubcategories,
        });
      }
    }

    return filtered;
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    onCategorySelect(category);
    setModalVisible(false);
    setSearchText('');
  };

  const handleClearSelection = () => {
    setSelectedCategory(null);
    onCategorySelect(null);
  };

  const filteredCategories = filterCategories(categories, searchText);

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryItem
      category={item}
      level={0}
      onSelect={handleCategorySelect}
      selectedId={selectedCategoryId}
    />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabledSelector]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategoryContainer}>
            <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color }]}>
              <Ionicons name={selectedCategory.icon as any} size={16} color="white" />
            </View>
            <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
            {!disabled && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSelection}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="folder-outline" size={20} color="#999" />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
        
        {!disabled && (
          <Ionicons name="chevron-down" size={20} color="#999" />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoria..."
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando categorias...</Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id.toString()}
              style={styles.categoriesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  disabledSelector: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  clearButton: {
    marginLeft: 8,
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalHeaderSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedCategoryItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedCategoryName: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default CategorySelector;
