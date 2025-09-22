import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface CategoryHierarchyProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
  onDeleteCategory?: (categoryId: number) => void;
  onEditCategory?: (category: Category) => void;
  onCreateSubcategory?: (parentCategory: Category) => void;
  showActions?: boolean;
  expandedByDefault?: boolean;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onPress?: (category: Category) => void;
  onDelete?: (categoryId: number) => void;
  onEdit?: (category: Category) => void;
  onCreateSubcategory?: (parentCategory: Category) => void;
  showActions?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onPress,
  onDelete,
  onEdit,
  onCreateSubcategory,
  showActions = true,
  isExpanded,
  onToggleExpand,
}) => {
  const hasSubcategories = category.subCategories && category.subCategories.length > 0;
  const indentWidth = level * 20;

  const handleDelete = () => {
    Alert.alert(
      'Excluir Categoria',
      `Tem certeza que deseja excluir "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete?.(category.id),
        },
      ]
    );
  };

  const handleCreateSubcategory = () => {
    onCreateSubcategory?.(category);
  };

  return (
    <View style={styles.nodeContainer}>
      {/* Categoria Principal */}
      <View style={[styles.categoryRow, { marginLeft: indentWidth }]}>
        <TouchableOpacity
          style={styles.categoryContent}
          onPress={() => onPress?.(category)}
          activeOpacity={0.7}
        >
          {/* Indicador de expansão */}
          {hasSubcategories && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onToggleExpand}
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
            <Ionicons name={category.icon as any} size={20} color="white" />
          </View>

          {/* Informações da categoria */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.categoryMeta}>
              <Text style={styles.categoryType}>
                {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </Text>
              <Text style={styles.transactionCount}>
                {category._count.transactions} transações
              </Text>
            </View>
            {category.description && (
              <Text style={styles.categoryDescription}>{category.description}</Text>
            )}
            {category.monthlyBudget && (
              <Text style={styles.monthlyBudget}>
                Orçamento: R$ {category.monthlyBudget.toFixed(2)}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Ações */}
        {showActions && (
          <View style={styles.actionsContainer}>
            {level === 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCreateSubcategory}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit?.(category)}
            >
              <Ionicons name="pencil-outline" size={20} color="#FF9500" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Subcategorias */}
      {hasSubcategories && isExpanded && (
        <View style={styles.subcategoriesContainer}>
          {category.subCategories.map((subcategory) => (
            <CategoryNode
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onPress={onPress}
              onDelete={onDelete}
              onEdit={onEdit}
              showActions={showActions}
              isExpanded={false}
              onToggleExpand={() => {}}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const CategoryHierarchy: React.FC<CategoryHierarchyProps> = ({
  categories,
  onCategoryPress,
  onDeleteCategory,
  onEditCategory,
  onCreateSubcategory,
  showActions = true,
  expandedByDefault = true,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set(expandedByDefault ? categories.map(cat => cat.id) : [])
  );

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryNode
      category={item}
      level={0}
      onPress={onCategoryPress}
      onDelete={onDeleteCategory}
      onEdit={onEditCategory}
      onCreateSubcategory={onCreateSubcategory}
      showActions={showActions}
      isExpanded={expandedCategories.has(item.id)}
      onToggleExpand={() => toggleExpanded(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 8,
  },
  nodeContainer: {
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  expandButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  transactionCount: {
    fontSize: 12,
    color: '#999',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  monthlyBudget: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  subcategoriesContainer: {
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    marginLeft: 20,
  },
});

export default CategoryHierarchy;
