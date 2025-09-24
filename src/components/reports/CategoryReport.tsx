import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface CategoryData {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  averageTransaction: number;
  subCategories: Array<{
    id: number;
    name: string;
    color: string;
    icon: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>;
}

interface CategoryReportProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshing: boolean;
}

export default function CategoryReport({ dateRange, refreshing }: CategoryReportProps) {
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
  const { getToken, signOut } = useAuth();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('EXPENSE');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategoryReport();
  }, [dateRange, refreshing, selectedType]);

  const loadCategoryReport = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
        ...(selectedType !== 'ALL' && { type: selectedType }),
      });

      const response = await api.get(`/reports/categories?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCategories(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar relatório de categorias:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar o relatório de categorias');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const renderProgressBar = (percentage: number, color: string) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.progressBarText}>{percentage.toFixed(1)}%</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="pie-chart" size={48} color={colors.textSecondary} />
        <Text style={styles.loadingText}>Carregando relatório...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros de Tipo */}
      <View style={styles.filterContainer}>
        {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === type && styles.filterButtonTextActive,
              ]}
            >
              {type === 'ALL' ? 'Todas' : type === 'INCOME' ? 'Receitas' : 'Despesas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma categoria encontrada</Text>
          <Text style={styles.emptySubtext}>
            Adicione transações para ver o relatório por categorias
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
          {categories.map((category) => (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategoryExpansion(category.id)}
              >
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={20} color="white" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryStats}>
                      {category.transactionCount} transações • Média: {formatCurrency(category.averageTransaction)}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={[
                    styles.categoryAmountText,
                    { color: category.type === 'INCOME' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {formatCurrency(category.totalAmount)}
                  </Text>
                  {category.subCategories.length > 0 && (
                    <Ionicons
                      name={expandedCategories.has(category.id) ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {/* Barra de Progresso */}
              {renderProgressBar(category.percentage, category.color)}

              {/* Subcategorias */}
              {expandedCategories.has(category.id) && category.subCategories.length > 0 && (
                <View style={styles.subCategoriesContainer}>
                  <Text style={styles.subCategoriesTitle}>Subcategorias</Text>
                  {category.subCategories.map((subCategory) => (
                    <View key={subCategory.id} style={styles.subCategoryItem}>
                      <View style={styles.subCategoryInfo}>
                        <View style={[styles.subCategoryIcon, { backgroundColor: subCategory.color }]}>
                          <Ionicons name={subCategory.icon as any} size={14} color="white" />
                        </View>
                        <View style={styles.subCategoryDetails}>
                          <Text style={styles.subCategoryName}>{subCategory.name}</Text>
                          <Text style={styles.subCategoryStats}>
                            {subCategory.transactionCount} transações
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.subCategoryAmount}>
                        {formatCurrency(subCategory.totalAmount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (theme: string, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  categoriesList: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  categoryStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  subCategoriesContainer: {
    backgroundColor: colors.background,
    paddingTop: 12,
  },
  subCategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subCategoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subCategoryDetails: {
    flex: 1,
  },
  subCategoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  subCategoryStats: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  subCategoryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});
