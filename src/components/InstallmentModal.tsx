'''
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

// INTERFACES SIMPLIFICADAS
interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface InstallmentModalProps {
  visible: boolean;
  onClose: () => void;
}

// COMPONENTE PRINCIPAL SIMPLIFICADO
export default function InstallmentModal({ visible, onClose }: InstallmentModalProps) {
  const { getToken } = useAuth();
  const colors = useTheme();
  const styles = getStyles(colors);

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // EFEITO PARA CARREGAR CATEGORIAS QUANDO O MODAL ABRE
  useEffect(() => {
    if (visible) {
      console.log('MODAL ABERTO. Carregando categorias...');
      loadCategories();
    } else {
      // Reseta o estado ao fechar para garantir consistência
      setShowCategorySelector(false);
      setSelectedCategory(null);
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const token = getToken();
      if (!token) {
        Alert.alert('Erro', 'Token não encontrado.');
        return;
      }
      const response = await api.get('/categories', {
        params: { hierarchical: false, type: 'EXPENSE' },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`CATEGORIAS CARREGADAS: ${response.data.length}`);
      setCategories(response.data);
    } catch (error) {
      console.error('ERRO AO CARREGAR CATEGORIAS:', error);
      Alert.alert('Erro', 'Não foi possível carregar as categorias.');
    }
  };

  const handleCategorySelect = (category: Category) => {
    console.log(`CATEGORIA SELECIONADA: ${category.name}`);
    setSelectedCategory(category);
    setShowCategorySelector(false); // Volta para a tela principal do modal
  };

  // RENDERIZA A VIEW DO SELETOR DE CATEGORIA
  const renderCategorySelector = () => (
    <SafeAreaView style={styles.fullScreenView} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowCategorySelector(false)} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Selecionar Categoria</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategorySelect(item)}>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma categoria encontrada.</Text>}
      />
    </SafeAreaView>
  );

  // RENDERIZA O FORMULÁRIO PRINCIPAL (AGORA APENAS O BOTÃO)
  const renderMainContent = () => (
    <View style={styles.fullScreenView}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Teste de Toque</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Clique no botão abaixo para abrir o seletor:</Text>
        
        {/* ESTE É O BOTÃO QUE PRECISAMOS TESTAR */}
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => {
            console.log('--- BOTÃO DE CATEGORIA PRESSIONADO ---');
            Alert.alert('Botão Pressionado', 'O evento de toque foi registrado com sucesso!');
            setShowCategorySelector(true);
          }}
          activeOpacity={0.7}
        >
          {selectedCategory ? (
            <Text style={styles.selectorText}>{selectedCategory.name}</Text>
          ) : (
            <Text style={styles.selectorPlaceholder}>Selecionar categoria</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.debugInfo}>
            <Text>Estado Atual: {showCategorySelector ? "Seletor Visível" : "Formulário Visível"}</Text>
            <Text>Categoria Selecionada: {selectedCategory?.name || "Nenhuma"}</Text>
        </View>

      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {/* A lógica de renderização condicional agora controla a UI inteira */}
      {showCategorySelector ? renderCategorySelector() : renderMainContent()}
    </Modal>
  );
}

// ESTILOS
const getStyles = (colors: any) => StyleSheet.create({
  fullScreenView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 60, // Espaçamento para o notch do iPhone
  },
  headerButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // Centraliza o conteúdo para o teste
  },
  label: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2, // Borda mais grossa para visibilidade
    borderColor: colors.primary, // Cor primária para destaque
    borderRadius: 10,
    padding: 20, // Padding maior
    backgroundColor: colors.surface,
    minHeight: 70, // Altura mínima maior
  },
  selectorText: { fontSize: 18, color: colors.text, fontWeight: 'bold' },
  selectorPlaceholder: { fontSize: 18, color: colors.textSecondary },
  debugInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  // Estilos do seletor de categoria
  categoryItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryName: { fontSize: 16, color: colors.text },
  emptyText: { textAlign: 'center', marginTop: 50, color: colors.textSecondary },
});
'''
