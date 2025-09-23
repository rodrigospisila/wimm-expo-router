import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

/**
 * Componente de teste simplificado para verificar se o problema do modal é específico do iOS
 * Este componente testa apenas a funcionalidade básica de abrir/fechar modal
 */
export default function SimpleModalTest() {
  const colors = useTheme();
  const styles = getStyles(colors);
  
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    console.log('🧪 SimpleModalTest: Abrindo modal...');
    console.log('📊 SimpleModalTest: showModal antes:', showModal);
    setShowModal(true);
    console.log('✅ SimpleModalTest: setShowModal(true) executado');
    
    // Verificação adicional
    setTimeout(() => {
      console.log('🔍 SimpleModalTest: Verificação após 100ms - showModal:', showModal);
    }, 100);
  };

  const closeModal = () => {
    console.log('🧪 SimpleModalTest: Fechando modal...');
    setShowModal(false);
    console.log('✅ SimpleModalTest: setShowModal(false) executado');
  };

  const handleItemPress = (item: string) => {
    console.log('✅ SimpleModalTest: Item selecionado:', item);
    Alert.alert('Item Selecionado', `Você selecionou: ${item}`);
    closeModal();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste Simples de Modal</Text>
      
      <TouchableOpacity
        style={styles.openButton}
        onPress={openModal}
        activeOpacity={0.6}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="folder" size={20} color="white" />
        <Text style={styles.openButtonText}>Abrir Modal Simples</Text>
      </TouchableOpacity>

      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>showModal: {showModal.toString()}</Text>
        <Text style={styles.debugText}>Timestamp: {new Date().toISOString()}</Text>
      </View>

      {/* Modal Simples */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={closeModal} 
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modal de Teste</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Este é um modal de teste simples para verificar se a funcionalidade básica funciona no iOS.
            </Text>

            {/* Test Items */}
            {['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.testItem}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.6}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <View style={styles.testItemIcon}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <Text style={styles.testItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
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
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
    minHeight: 56,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  openButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testItemIcon: {
    marginRight: 12,
  },
  testItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});
