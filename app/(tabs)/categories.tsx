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
import api from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
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
  const theme = useTheme();
  const styles = getStyles(theme);
  const { getToken, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE' | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy' | 'statistics'>('hierarchy');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
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
      const currentToken = await getToken();
      if (!currentToken) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const params = new URLSearchParams();
      
      if (selectedType !== 'ALL') {
        params.append('type', selectedType);
      }
      
      if (viewMode === 'hierarchy') {
        params.append('hierarchical', 'true');
      }

      const response = await api.get(`/categories?${params.toString()}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      setCategories(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as categorias');
      }
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
                const currentToken = await getToken();
                if (!currentToken) {
                  Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
                  await signOut();
                  return;
                }

                await api.post('/categories/default', {}, {
                  headers: { Authorization: `Bearer ${currentToken}` }
                });
                
                Alert.alert('Sucesso', 'Categorias padrão criadas com sucesso!');
                loadCategories();
              } catch (error: any) {
                if (error.response?.status === 401) {
                  Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
                  await signOut();
                } else {
                  const message = error.response?.data?.message || 'Erro ao criar categorias padrão';
                  Alert.alert('Erro', message);
                }
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
                const currentToken = await getToken();
                if (!currentToken) {
                  Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
                  await signOut();
                  return;
                }

                await api.post('/categories/default/subcategories', {}, {
                  headers: { Authorization: `Bearer ${currentToken}` }
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

      const currentToken = await getToken();
      if (!currentToken) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      await api.post('/categories', dataToSend, {
        headers: { Authorization: `Bearer ${currentToken}` }
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
                const currentToken = await getToken();
                if (!currentToken) {
                  Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
                  await signOut();
                  return;
                }

                await api.delete(`/categories/${categoryId}`, {
                  headers: { Authorization: `Bearer ${currentToken}` }
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

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isExpanded = expandedCategories.has(item.id);
    const hasSubcategories = item.subCategories && item.subCategories.length > 0;

    return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <TouchableOpacity 
          style={styles.categoryInfo}
          onPress={() => hasSubcategories && toggleCategoryExpansion(item.id)}
          activeOpacity={hasSubcategories ? 0.7 : 1}
        >
          <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon as any} size={24} color="white" />
          </View>
          <View style={styles.categoryDetails}>
            <View style={styles.categoryNameRow}>
              <Text style={styles.categoryName}>{item.name}</Text>
              {hasSubcategories && (
                <View style={styles.subcategoryIndicator}>
                  <Text style={styles.subcategoryCount}>
                    {item.subCategories.length} subcategoria{item.subCategories.length > 1 ? 's' : ''}
                  </Text>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#666" 
                  />
                </View>
              )}
            </View>
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
        </TouchableOpacity>
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.addSubcategoryButton}
            onPress={() => {
              setFormData({
                name: '',
                type: item.type,
                description: '',
                color: '#007AFF',
                icon: 'folder',
                parentCategoryId: item.id,
              });
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteCategory(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF5722" />
          </TouchableOpacity>
        </View>
      </View>
      
      {viewMode === 'hierarchy' && isExpanded && hasSubcategories && (
        <View style={styles.subCategoriesContainer}>
          <Text style={styles.subCategoriesTitle}>Subcategorias:</Text>
          {item.subCategories.map((subCategory) => (
            <View key={subCategory.id} style={styles.subCategoryItem}>
              <View style={[styles.subCategoryIcon, { backgroundColor: subCategory.color }]}>
                <Ionicons name={subCategory.icon as any} size={16} color="white" />
              </View>
              <View style={styles.subCategoryDetails}>
                <Text style={styles.subCategoryName}>{subCategory.name}</Text>
                {subCategory.description && (
                  <Text style={styles.subCategoryDescription}>{subCategory.description}</Text>
                )}
              </View>
              <View style={styles.subCategoryActions}>
                <Text style={styles.subCategoryTransactionCount}>
                  {subCategory._count.transactions} transações
                </Text>
                <TouchableOpacity
                  style={styles.deleteSubcategoryButton}
                  onPress={() => deleteCategory(subCategory.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5722" />
                </TouchableOpacity>
              </View>
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
            <Text style={styles.modalTitle}>
              {formData.parentCategoryId ? 'Nova Subcategoria' : 'Nova Categoria'}
            </Text>
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

            {/* Seletor de Categoria Pai */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Categoria Pai (opcional)</Text>
              <Text style={styles.formHint}>
                Deixe em branco para criar uma categoria principal, ou selecione uma categoria para criar uma subcategoria
              </Text>
              <TouchableOpacity
                style={styles.parentCategorySelector}
                onPress={() => {
                  // Implementar seletor de categoria pai
                  Alert.alert(
                    'Selecionar Categoria Pai',
                    'Escolha uma categoria principal para criar uma subcategoria:',
                    [
                      { text: 'Nenhuma (Categoria Principal)', onPress: () => setFormData({ ...formData, parentCategoryId: undefined }) },
                      ...categories
                        .filter(cat => cat.type === formData.type && !cat.parentCategoryId) // Apenas categorias principais do mesmo tipo
                        .map(cat => ({
                          text: cat.name,
                          onPress: () => setFormData({ ...formData, parentCategoryId: cat.id })
                        }))
                    ]
                  );
                }}
              >
                <Text style={styles.parentCategorySelectorText}>
                  {formData.parentCategoryId 
                    ? categories.find(cat => cat.id === formData.parentCategoryId)?.name || 'Categoria não encontrada'
                    : 'Nenhuma (Categoria Principal)'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
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



const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    padding: 5,
    marginLeft: 10,
  },
  activeViewButton: {
    backgroundColor: theme.primary + '20',
    borderRadius: 5,
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: theme.card,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
  },
  filterText: {
    fontSize: 14,
    color: theme.text,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 15,
  },
  createDefaultButton: {
    marginTop: 20,
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createDefaultText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalCancelButton: {
    fontSize: 16,
    color: theme.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: theme.card,
    color: theme.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  typeText: {
    fontSize: 16,
    color: theme.text,
  },
  typeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.primary,
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.card,
    margin: 5,
  },
  selectedIcon: {
    backgroundColor: theme.primary,
  },
  // Novos estilos para subcategorias
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addSubcategoryButton: {
    padding: 8,
    backgroundColor: theme.primary + '20',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  parentCategorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  parentCategorySelectorText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  // Estilos para expansão de categorias
  categoryNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subcategoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subcategoryCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  subCategoryDetails: {
    flex: 1,
    marginLeft: 8,
  },
  subCategoryDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  subCategoryActions: {
    alignItems: 'flex-end',
  },
  subCategoryTransactionCount: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  deleteSubcategoryButton: {
    padding: 4,
  },
});
