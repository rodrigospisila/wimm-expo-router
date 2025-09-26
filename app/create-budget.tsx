import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { budgetService } from '../src/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: string;
}

export default function CreateBudgetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [loading, setLoading] = useState(false);

  // Capturar dados da categoria selecionada quando retornar da tela de seleção
  useEffect(() => {
    if (params.categoryId && params.categoryName) {
      const category: Category = {
        id: Number(params.categoryId),
        name: String(params.categoryName),
        icon: String(params.categoryIcon || 'wallet'),
        color: String(params.categoryColor || '#666'),
        type: 'EXPENSE'
      };
      
      setSelectedCategory(category);
      
      // Limpar os parâmetros da rota para evitar reprocessamento
      router.setParams({
        categoryId: undefined,
        categoryName: undefined,
        categoryIcon: undefined,
        categoryColor: undefined
      });
    }
  }, [params]);

  const handleCategorySelection = () => {
    router.push({
      pathname: '/category-select',
      params: {
        returnTo: '/create-budget'
      }
    });
  };

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/[^0-9]/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter os centavos
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleLimitChange = (text: string) => {
    const formatted = formatCurrency(text);
    setMonthlyLimit(formatted);
  };

  const parseCurrencyToNumber = (value: string): number => {
    // Remove símbolos de moeda e converte para número
    const numbers = value.replace(/[^0-9,]/g, '').replace(',', '.');
    return parseFloat(numbers) || 0;
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria.');
      return;
    }

    if (!monthlyLimit || parseCurrencyToNumber(monthlyLimit) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um limite mensal válido.');
      return;
    }

    try {
      setLoading(true);
      
      await budgetService.createBudget({
        categoryId: selectedCategory.id,
        monthlyLimit: parseCurrencyToNumber(monthlyLimit),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });

      // Navegar diretamente para a tela de orçamentos
      router.replace('/(tabs)/budgets');
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      Alert.alert('Erro', 'Não foi possível criar o orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setMonthlyLimit('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Novo Orçamento
        </Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetForm}
        >
          <Text style={[styles.resetButtonText, { color: colors.primary }]}>
            Limpar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seleção de Categoria */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Categoria *
          </Text>
          <TouchableOpacity
            style={[
              styles.categorySelector,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={handleCategorySelection}
          >
            {selectedCategory ? (
              <View style={styles.selectedCategoryContent}>
                <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color }]}>
                  <Ionicons
                    name={selectedCategory.icon as any}
                    size={16}
                    color="white"
                  />
                </View>
                <Text style={[styles.selectedCategoryText, { color: colors.text }]}>
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                Selecionar categoria
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Limite Mensal */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Limite Mensal *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            placeholder="Ex: R$ 500,00"
            placeholderTextColor={colors.textSecondary}
            value={monthlyLimit}
            onChangeText={handleLimitChange}
            keyboardType="numeric"
          />
        </View>

        {/* Informações adicionais */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            O orçamento será aplicado para o mês atual. Você poderá acompanhar seus gastos e receber alertas quando se aproximar do limite.
          </Text>
        </View>
      </ScrollView>

      {/* Botão de Salvar */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: selectedCategory && monthlyLimit ? colors.primary : colors.border,
            }
          ]}
          onPress={handleSave}
          disabled={!selectedCategory || !monthlyLimit || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              Criar Orçamento
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCategoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
  },
  input: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
