import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import CategoryHierarchy from '../../src/components/CategoryHierarchy';
import CategoryStatistics from '../../src/components/CategoryStatistics';

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

interface CreateCategoryData {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  color: string;
  icon: string;
  monthlyBudget?: number;
  parentCategoryId?: number;
}

export default function CategoriesScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy' | 'statistics'>('hierarchy');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  
  // Form state
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    type: 'EXPENSE',
    description: '',
    color: '#FF5722',
    icon: 'folder',
  });

  const predefinedColors = [
    '#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#CDDC39',
    '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#03A9F4',
    '#2196F3', '#3F51B5', '#673AB7', '#9C27B0', '#E91E63',
    '#F44336', '#795548', '#607D8B', '#9E9E9E', '#000000'
  ];

  const predefinedIcons = [
    'folder', 'restaurant', 'car', 'home', 'medical', 'school',
    'movie', 'shopping-cart', 'build', 'trending-up', 'trending-down',
    'wallet', 'card', 'cash', 'gift', 'airplane', 'fitness',
    'game-controller', 'musical-notes', 'camera'
  ];

  useEffect(() => {
    loadCategories();
  }, [selectedType, viewMode]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedType !== 'ALL') {
        params.append('type', selectedType);
      }
      
      if (viewMode === 'hierarchy') {
        params.append('hierarchical', 'true');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const createDefaultCategories = async () => {
    try {
      Alert.alert(
        'Criar Categorias Padrão',
        'Isso criará um conjunto de categorias padrão. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Criar',
            onPress: async () => {
              try {
                await api.post('/categories/default', {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                Alert.alert('Sucesso', 'Categorias padrão criadas com sucesso!');
                loadCategories();
              } catch (error: any) {
                const message = error.response?.data?.message || 'Erro ao criar categorias padrão';
                Alert.alert('Erro', message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const createDefaultSubcategories = async () => {
    try {
      Alert.alert(
        'Criar Subcategorias Padrão',
        'Isso criará subcategorias para as categorias principais existentes. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Criar',
            onPress: async () => {
              try {
                await api.post('/categories/default/subcategories', {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                Alert.alert('Sucesso', 'Subcategorias padrão criadas com sucesso!');
                loadCategories();
              } catch (error: any) {
                const message = error.response?.data?.message || 'Erro ao criar subcategorias padrão';
                Alert.alert('Erro', message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Erro', 'Nome da categoria é obrigatório');
        return;
      }

      const dataToSend = {
        ...formData,
        description: formData.description || undefined,
        monthlyBudget: formData.monthlyBudget || undefined,
      };

      await api.post('/categories', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Sucesso', 'Categoria criada com sucesso!');
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar categoria';
      Alert.alert('Erro', message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EXPENSE',
      description: '',
      color: '#007AFF',
      icon: 'folder',
      monthlyBudget: '',
      parentCategoryId: null,
    });
  };

  const filteredCategories = categories.filter(category => {
    if (selectedType === 'ALL') return true;
    return category.type === selectedType;
  });

  const deleteCategory = async (categoryId: number) => {
    try {
      Alert.alert(
        'Excluir Categoria',
        'Tem certeza que deseja excluir esta categoria?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/categories/${categoryId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                Alert.alert('Sucesso', 'Categoria excluída com sucesso!');
                loadCategories();
              } catch (error: any) {
                const message = error.response?.data?.message || 'Erro ao excluir categoria';
                Alert.alert('Erro', message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon as any} size={24} color="white" />
          </View>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryType}>
              {item.type === 'INCOME' ? 'Receita' : 'Despesa'}
            </Text>
            {item.description && (
              <Text style={styles.categoryDescription}>{item.description}</Text>
            )}
            <Text style={styles.transactionCount}>
              {item._count.transactions} transações
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteCategory(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF5722" />
        </TouchableOpacity>
      </View>
      
      {hierarchicalView && item.subCategories && item.subCategories.length > 0 && (
        <View style={styles.subCategoriesContainer}>
          <Text style={styles.subCategoriesTitle}>Subcategorias:</Text>
          {item.subCategories.map((subCategory) => (
            <View key={subCategory.id} style={styles.subCategoryItem}>
              <View style={[styles.subCategoryIcon, { backgroundColor: subCategory.color }]}>
                <Ionicons name={subCategory.icon as any} size={16} color="white" />
              </View>
              <Text style={styles.subCategoryName}>{subCategory.name}</Text>
              <Text style={styles.subCategoryCount}>
                ({subCategory._count.transactions})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categorias</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.activeViewButton]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'list' ? "#007AFF" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'hierarchy' && styles.activeViewButton]}
              onPress={() => setViewMode('hierarchy')}
            >
              <Ionicons name="git-network" size={20} color={viewMode === 'hierarchy' ? "#007AFF" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'statistics' && styles.activeViewButton]}
              onPress={() => setViewMode('statistics')}
            >
              <Ionicons name="bar-chart" size={20} color={viewMode === 'statistics' ? "#007AFF" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'ALL' && styles.filterButtonActive]}
          onPress={() => setSelectedType('ALL')}
        >
          <Text style={[styles.filterText, selectedType === 'ALL' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'INCOME' && styles.filterButtonActive]}
          onPress={() => setSelectedType('INCOME')}
        >
          <Text style={[styles.filterText, selectedType === 'INCOME' && styles.filterTextActive]}>
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'EXPENSE' && styles.filterButtonActive]}
          onPress={() => setSelectedType('EXPENSE')}
        >
          <Text style={[styles.filterText, selectedType === 'EXPENSE' && styles.filterTextActive]}>
            Despesas
          </Text>
        </TouchableOpacity>
      </View>

      {categories.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
          <TouchableOpacity
            style={styles.createDefaultButton}
            onPress={createDefaultCategories}
          >
            <Text style={styles.createDefaultText}>Criar Categorias Padrão</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {viewMode === 'statistics' ? (
            <CategoryStatistics
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={setSelectedCategoryId}
            />
          ) : viewMode === 'hierarchy' ? (
            <CategoryHierarchy
              categories={filteredCategories}
              onCategoryPress={(category) => {
                // Implementar ação ao pressionar categoria
                console.log('Categoria selecionada:', category);
              }}
              onDeleteCategory={deleteCategory}
              onEditCategory={(category) => {
                // Implementar edição
                console.log('Editar categoria:', category);
              }}
              onCreateSubcategory={(parentCategory) => {
                // Implementar criação de subcategoria
                setFormData(prev => ({ ...prev, parentCategoryId: parentCategory.id }));
                setShowModal(true);
              }}
              showActions={true}
              expandedByDefault={true}
            />
          ) : (
            <FlatList
              data={filteredCategories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}

      {/* Modal para criar categoria */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova Categoria</Text>
            <TouchableOpacity onPress={handleCreateCategory}>
              <Text style={styles.modalSaveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nome *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Nome da categoria"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'INCOME' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'INCOME' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'INCOME' && styles.typeButtonTextActive
                  ]}>
                    Receita
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'EXPENSE' && styles.typeButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'EXPENSE' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'EXPENSE' && styles.typeButtonTextActive
                  ]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descrição</Text>
              <TextInput
                style={styles.formInput}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Descrição opcional"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Cor</Text>
              <View style={styles.colorSelector}>
                {predefinedColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ícone</Text>
              <View style={styles.iconSelector}>
                {predefinedIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      formData.icon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, icon })}
                  >
                    <Ionicons name={icon as any} size={24} color="#333" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
   headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  viewButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeViewButton: {
    backgroundColor: '#E3F2FD',
  },
  categoryItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  subCategoriesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subCategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  subCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subCategoryName: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  subCategoryCount: {
    fontSize: 12,
    color: '#999',
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
    marginTop: 16,
    marginBottom: 24,
  },
  createDefaultButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  createDefaultText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    color: '#FF3B30',
    fontSize: 16,
  },
  modalSaveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#007AFF',
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
});
