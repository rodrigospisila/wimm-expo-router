import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import CategorySelectorModal from './CategorySelectorModal';

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
}

/**
 * Componente de teste para verificar isoladamente o comportamento do CategorySelectorModal
 * Este componente pode ser usado para testar se o modal funciona corretamente
 */
export default function TestCategoryModal() {
  const colors = useTheme();
  const styles = getStyles(colors);
  
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const openCategorySelector = () => {
    console.log('🧪 TestCategoryModal: openCategorySelector chamada');
    console.log('📊 TestCategoryModal: showCategorySelector antes:', showCategorySelector);
    setShowCategorySelector(true);
    console.log('✅ TestCategoryModal: setShowCategorySelector(true) executado');
  };

  const closeCategorySelector = () => {
    console.log('🧪 TestCategoryModal: closeCategorySelector chamada');
    setShowCategorySelector(false);
    console.log('✅ TestCategoryModal: setShowCategorySelector(false) executado');
  };

  const handleCategorySelect = (category: Category) => {
    console.log('✅ TestCategoryModal: Categoria selecionada:', category.name);
    setSelectedCategory(category);
    setShowCategorySelector(false);
    Alert.alert('Categoria Selecionada', `Você selecionou: ${category.name}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste do Modal de Categoria</Text>
      
      <TouchableOpacity
        style={styles.testButton}
        onPress={openCategorySelector}
        activeOpacity={0.7}
      >
        <Ionicons name="folder" size={20} color="white" />
        <Text style={styles.testButtonText}>Abrir Modal de Categoria</Text>
      </TouchableOpacity>

      {selectedCategory && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>Categoria Selecionada:</Text>
          <View style={styles.selectedItem}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
              <Ionicons name={selectedCategory.icon as any} size={16} color="white" />
            </View>
            <Text style={styles.selectedText}>{selectedCategory.name}</Text>
          </View>
        </View>
      )}

      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>showCategorySelector: {showCategorySelector.toString()}</Text>
        <Text style={styles.debugText}>selectedCategory: {selectedCategory?.name || 'nenhuma'}</Text>
      </View>

      <CategorySelectorModal
        visible={showCategorySelector}
        onClose={closeCategorySelector}
        onSelect={handleCategorySelect}
        type="EXPENSE"
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedContainer: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  debugInfo: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
});
