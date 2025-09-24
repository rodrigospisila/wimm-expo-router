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
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
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
  };

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

const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.primary + '20',
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
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: colors.card,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.text,
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
    color: colors.text,
    marginTop: 15,
  },
  createDefaultButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancelButton: {
    fontSize: 16,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
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
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.card,
    color: colors.text,
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
    borderColor: colors.border,
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 16,
    color: colors.text,
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
    borderColor: colors.primary,
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
    backgroundColor: colors.card,
    margin: 5,
  },
  selectedIcon: {
    backgroundColor: colors.primary,
  },
  // Novos estilos para subcategorias
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addSubcategoryButton: {
    padding: 8,
    backgroundColor: colors.primary + '20',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  parentCategorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  parentCategorySelectorText: {
    fontSize: 16,
    color: colors.text,
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
    color: colors.textSecondary,
    marginTop: 2,
  },
  subCategoryActions: {
    alignItems: 'flex-end',
  },
  subCategoryTransactionCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  deleteSubcategoryButton: {
    padding: 4,
  },
});
