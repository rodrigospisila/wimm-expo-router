import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { categoryService } from '../src/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: string;
  parentCategoryId?: number;
  subCategories?: Category[];
}

export default function CategorySelectScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      
      // Organizar categorias e subcategorias
      const mainCategories = data.filter((cat: any) => !cat.parentCategoryId);
      const subcategories = data.filter((cat: any) => cat.parentCategoryId);
      
      const categoriesWithSubs = mainCategories.map((cat: any) => ({
        ...cat,
        subCategories: subcategories.filter((sub: any) => sub.parentCategoryId === cat.id),
      }));
      
      // Filtrar apenas categorias de despesa
      const expenseCategories = categoriesWithSubs.filter(cat => 
        cat.type === 'EXPENSE'
      );
      
      setCategories(expenseCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelectCategory = (category: Category) => {
    // Retornar para a tela anterior com a categoria selecionada
    router.navigate({
      pathname: returnTo as string || '/(tabs)/budgets',
      params: {
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Carregando categorias...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Selecionar Categoria
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {categories.length === 0 && !loading ? (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nenhuma categoria encontrada
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Não há categorias de despesa disponíveis para seleção. {'\n'}
            Verifique se existem categorias cadastradas no sistema.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: category }) => (
          <View>
            <TouchableOpacity
              style={[styles.categoryItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                if ((category.subCategories || []).length > 0) {
                  toggleCategoryExpansion(category.id);
                } else {
                  handleSelectCategory(category);
                }
              }}
            >
              <View style={styles.categoryMain}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: (category.color || '#666') + '20' }
                  ]}
                >
                  <Ionicons
                    name={(category.icon || 'wallet') as any}
                    size={20}
                    color={category.color || '#666'}
                  />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.name || 'Categoria'}
                </Text>
              </View>

              {(category.subCategories || []).length > 0 && (
                <View style={styles.categoryRight}>
                  <Text style={[styles.subcategoryCount, { color: colors.textSecondary }]}>
                    {(category.subCategories || []).length} subcategorias
                  </Text>
                  <Ionicons
                    name={expandedCategories.has(category.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>

            {expandedCategories.has(category.id) && (
              <View style={[styles.subcategoriesContainer, { backgroundColor: colors.background }]}>
                {(category.subCategories || []).map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory.id}
                    style={[styles.subcategoryItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectCategory(subcategory)}
                  >
                    <View
                      style={[
                        styles.subcategoryIcon,
                        { backgroundColor: (subcategory.color || category.color || '#666') + '20' }
                      ]}
                    >
                      <Ionicons
                        name={(subcategory.icon || category.icon || 'wallet') as any}
                        size={16}
                        color={subcategory.color || category.color || '#666'}
                      />
                    </View>
                    <Text style={[styles.subcategoryName, { color: colors.text }]}>
                      {subcategory.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  categoryMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryCount: {
    fontSize: 14,
    marginRight: 8,
  },
  subcategoriesContainer: {
    paddingLeft: 20,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
    borderBottomWidth: 1,
  },
  subcategoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subcategoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
