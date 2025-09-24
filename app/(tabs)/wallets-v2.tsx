import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { api } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  creditLimit?: number;
  availableLimit?: number;
  closingDay?: number;
  dueDay?: number;
  isPrimary: boolean;
  color: string;
  icon: string;
}

interface WalletGroup {
  id: number;
  name: string;
  type: string;
  description?: string;
  color: string;
  icon: string;
  hasIntegratedPix: boolean;
  hasWalletBalance: boolean;
  paymentMethods: PaymentMethod[];
}

interface WalletOverview {
  groups: WalletGroup[];
  independentMethods: PaymentMethod[];
  summary: {
    totalBalance: number;
    totalCreditLimit: number;
    totalAvailableCredit: number;
    totalUsedCredit: number;
    groupsCount: number;
    paymentMethodsCount: number;
  };
}

export default function WalletsV2Screen() {
  const { theme, colors } = useTheme();
  const { getToken } = useAuth();
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  // Modais
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WalletGroup | null>(null);
  const [groupTypes, setGroupTypes] = useState([]);
  const [paymentMethodTypes, setPaymentMethodTypes] = useState([]);
  
  // Formulários
  const [groupForm, setGroupForm] = useState({
    name: '',
    type: 'DIGITAL_WALLET',
    description: '',
    color: '#4CAF50',
    icon: 'wallet',
    hasIntegratedPix: false,
    hasWalletBalance: false,
  });
  
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    name: '',
    type: 'CREDIT_CARD',
    currentBalance: 0,
    creditLimit: 0,
    closingDay: 5,
    dueDay: 15,
    walletGroupId: null as number | null,
    isPrimary: false,
    color: '#4CAF50',
    icon: 'credit-card',
    accountNumber: '',
    agency: '',
  });

  const loadOverview = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get('/wallets-v2/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setOverview(response.data);
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
      Alert.alert('Erro', 'Não foi possível carregar as carteiras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  const loadGroupTypes = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get('/wallets-v2/groups/types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setGroupTypes(response.data.types);
    } catch (error) {
      console.error('Erro ao carregar tipos de grupo:', error);
    }
  }, [getToken]);

  const loadPaymentMethodTypes = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get('/wallets-v2/payment-methods/types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setPaymentMethodTypes(response.data.types);
    } catch (error) {
      console.error('Erro ao carregar tipos de método de pagamento:', error);
    }
  }, [getToken]);

  useEffect(() => {
    loadOverview();
    loadGroupTypes();
    loadPaymentMethodTypes();
  }, [loadOverview, loadGroupTypes, loadPaymentMethodTypes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOverview();
  }, [loadOverview]);

  const toggleGroupExpansion = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const openGroupModal = (group?: WalletGroup) => {
    if (group) {
      setGroupForm({
        name: group.name,
        type: group.type,
        description: group.description || '',
        color: group.color,
        icon: group.icon,
        hasIntegratedPix: group.hasIntegratedPix,
        hasWalletBalance: group.hasWalletBalance,
      });
      setSelectedGroup(group);
    } else {
      setGroupForm({
        name: '',
        type: 'DIGITAL_WALLET',
        description: '',
        color: '#4CAF50',
        icon: 'wallet',
        hasIntegratedPix: false,
        hasWalletBalance: false,
      });
      setSelectedGroup(null);
    }
    setShowGroupModal(true);
  };

  const openPaymentMethodModal = (group?: WalletGroup) => {
    setPaymentMethodForm({
      name: '',
      type: 'CREDIT_CARD',
      currentBalance: 0,
      creditLimit: 0,
      closingDay: 5,
      dueDay: 15,
      walletGroupId: group?.id || null,
      isPrimary: false,
      color: group?.color || '#4CAF50',
      icon: 'credit-card',
      accountNumber: '',
      agency: '',
    });
    setShowPaymentMethodModal(true);
  };

  const handleSaveGroup = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      if (selectedGroup) {
        // Atualizar grupo existente
        await api.patch(`/wallets-v2/groups/${selectedGroup.id}`, groupForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Criar novo grupo
        await api.post('/wallets-v2/groups', groupForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowGroupModal(false);
      loadOverview();
      Alert.alert('Sucesso', selectedGroup ? 'Grupo atualizado!' : 'Grupo criado!');
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o grupo');
    }
  };

  const handleSavePaymentMethod = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await api.post('/wallets-v2/payment-methods', paymentMethodForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowPaymentMethodModal(false);
      loadOverview();
      Alert.alert('Sucesso', 'Método de pagamento criado!');
    } catch (error) {
      console.error('Erro ao salvar método de pagamento:', error);
      Alert.alert('Erro', 'Não foi possível salvar o método de pagamento');
    }
  };

  const createDefaultGroups = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await api.post('/wallets-v2/groups/create-defaults', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      loadOverview();
      Alert.alert('Sucesso', 'Grupos padrão criados!');
    } catch (error) {
      console.error('Erro ao criar grupos padrão:', error);
      Alert.alert('Erro', 'Não foi possível criar os grupos padrão');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      CREDIT_CARD: 'card',
      DEBIT_CARD: 'card-outline',
      WALLET_BALANCE: 'wallet',
      PIX: 'flash',
      CHECKING_ACCOUNT: 'business',
      SAVINGS_ACCOUNT: 'piggy-bank',
      CASH: 'cash',
      INVESTMENT: 'trending-up',
      OTHER: 'ellipsis-horizontal',
    };
    return iconMap[type] || 'card';
  };

  const styles = getStyles(theme, colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando carteiras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header com Resumo */}
        {overview && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo Financeiro</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Saldo Total</Text>
                <Text style={styles.summaryValue}>{formatCurrency(overview.summary.totalBalance)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Limite Disponível</Text>
                <Text style={styles.summaryValueCredit}>{formatCurrency(overview.summary.totalAvailableCredit)}</Text>
              </View>
            </View>
            <View style={styles.summaryStats}>
              <Text style={styles.summaryStatText}>
                {overview.summary.groupsCount} carteiras • {overview.summary.paymentMethodsCount} métodos
              </Text>
            </View>
          </View>
        )}

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openGroupModal()}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Nova Carteira</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={createDefaultGroups}>
            <Ionicons name="download" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Carteiras Padrão</Text>
          </TouchableOpacity>
        </View>

        {/* Grupos de Carteiras */}
        {overview?.groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroupExpansion(group.id)}
            >
              <View style={styles.groupInfo}>
                <View style={[styles.groupIcon, { backgroundColor: group.color }]}>
                  <Ionicons name={group.icon as any} size={24} color="white" />
                </View>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>
                    {group.paymentMethods.length} método(s) • {group.description}
                  </Text>
                </View>
              </View>
              <View style={styles.groupActions}>
                <TouchableOpacity
                  style={styles.addMethodButton}
                  onPress={() => openPaymentMethodModal(group)}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                </TouchableOpacity>
                <Ionicons
                  name={expandedGroups.has(group.id) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {/* Métodos de Pagamento */}
            {expandedGroups.has(group.id) && (
              <View style={styles.paymentMethods}>
                {group.paymentMethods.map((method) => (
                  <View key={method.id} style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodInfo}>
                      <Ionicons
                        name={getPaymentMethodIcon(method.type) as any}
                        size={20}
                        color={method.color}
                      />
                      <View style={styles.paymentMethodDetails}>
                        <Text style={styles.paymentMethodName}>{method.name}</Text>
                        <Text style={styles.paymentMethodBalance}>
                          {formatCurrency(method.currentBalance)}
                        </Text>
                        {method.type === 'CREDIT_CARD' && (
                          <Text style={styles.paymentMethodLimit}>
                            Limite: {formatCurrency(method.availableLimit || 0)} / {formatCurrency(method.creditLimit || 0)}
                          </Text>
                        )}
                      </View>
                    </View>
                    {method.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Principal</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Métodos Independentes */}
        {overview?.independentMethods && overview.independentMethods.length > 0 && (
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupInfo}>
                <View style={[styles.groupIcon, { backgroundColor: colors.textSecondary }]}>
                  <Ionicons name="wallet" size={24} color="white" />
                </View>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>Contas Independentes</Text>
                  <Text style={styles.groupDescription}>
                    {overview.independentMethods.length} método(s) • Contas avulsas
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={() => openPaymentMethodModal()}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethods}>
              {overview.independentMethods.map((method) => (
                <View key={method.id} style={styles.paymentMethodCard}>
                  <View style={styles.paymentMethodInfo}>
                    <Ionicons
                      name={getPaymentMethodIcon(method.type) as any}
                      size={20}
                      color={method.color}
                    />
                    <View style={styles.paymentMethodDetails}>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      <Text style={styles.paymentMethodBalance}>
                        {formatCurrency(method.currentBalance)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Estado Vazio */}
        {(!overview?.groups || overview.groups.length === 0) && 
         (!overview?.independentMethods || overview.independentMethods.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Nenhuma carteira encontrada</Text>
            <Text style={styles.emptyStateDescription}>
              Crie sua primeira carteira ou importe as carteiras padrão
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={createDefaultGroups}>
              <Text style={styles.emptyStateButtonText}>Criar Carteiras Padrão</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de Grupo */}
      <Modal visible={showGroupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedGroup ? 'Editar Carteira' : 'Nova Carteira'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome da carteira"
              value={groupForm.name}
              onChangeText={(text) => setGroupForm({ ...groupForm, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Descrição (opcional)"
              value={groupForm.description}
              onChangeText={(text) => setGroupForm({ ...groupForm, description: text })}
            />

            {/* Seletor de Tipo de Grupo */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Tipo de Carteira</Text>
              <ScrollView style={styles.typeSelector} horizontal showsHorizontalScrollIndicator={false}>
                {groupTypes.map((type: any) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      groupForm.type === type.value && styles.typeOptionSelected
                    ]}
                    onPress={() => setGroupForm({ ...groupForm, type: type.value })}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={groupForm.type === type.value ? 'white' : colors.primary} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      groupForm.type === type.value && styles.typeOptionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>PIX Integrado</Text>
              <Switch
                value={groupForm.hasIntegratedPix}
                onValueChange={(value) => setGroupForm({ ...groupForm, hasIntegratedPix: value })}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Saldo na Carteira</Text>
              <Switch
                value={groupForm.hasWalletBalance}
                onValueChange={(value) => setGroupForm({ ...groupForm, hasWalletBalance: value })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowGroupModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGroup}
                disabled={!groupForm.name || !groupForm.type}
              >
                <Text style={[
                  styles.saveButtonText,
                  (!groupForm.name || !groupForm.type) && styles.saveButtonTextDisabled
                ]}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Método de Pagamento */}
      <Modal visible={showPaymentMethodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Método de Pagamento</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome do método"
              value={paymentMethodForm.name}
              onChangeText={(text) => setPaymentMethodForm({ ...paymentMethodForm, name: text })}
            />

            {/* Seletor de Tipo */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Tipo de Método</Text>
              <ScrollView style={styles.typeSelector} horizontal showsHorizontalScrollIndicator={false}>
                {paymentMethodTypes.map((type: any) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      paymentMethodForm.type === type.value && styles.typeOptionSelected
                    ]}
                    onPress={() => setPaymentMethodForm({ ...paymentMethodForm, type: type.value })}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={paymentMethodForm.type === type.value ? 'white' : colors.primary} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      paymentMethodForm.type === type.value && styles.typeOptionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Campos condicionais baseados no tipo */}
            {paymentMethodForm.type === 'CREDIT_CARD' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Limite de crédito"
                  keyboardType="numeric"
                  value={paymentMethodForm.creditLimit.toString()}
                  onChangeText={(text) => setPaymentMethodForm({ 
                    ...paymentMethodForm, 
                    creditLimit: parseFloat(text) || 0 
                  })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dia de fechamento (1-28)"
                  keyboardType="numeric"
                  value={paymentMethodForm.closingDay.toString()}
                  onChangeText={(text) => setPaymentMethodForm({ 
                    ...paymentMethodForm, 
                    closingDay: parseInt(text) || 5 
                  })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dia de vencimento"
                  keyboardType="numeric"
                  value={paymentMethodForm.dueDay.toString()}
                  onChangeText={(text) => setPaymentMethodForm({ 
                    ...paymentMethodForm, 
                    dueDay: parseInt(text) || 15 
                  })}
                />
              </>
            )}

            {(paymentMethodForm.type === 'CHECKING_ACCOUNT' || paymentMethodForm.type === 'SAVINGS_ACCOUNT') && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Número da conta"
                  value={paymentMethodForm.accountNumber || ''}
                  onChangeText={(text) => setPaymentMethodForm({ 
                    ...paymentMethodForm, 
                    accountNumber: text 
                  })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Agência"
                  value={paymentMethodForm.agency || ''}
                  onChangeText={(text) => setPaymentMethodForm({ 
                    ...paymentMethodForm, 
                    agency: text 
                  })}
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Saldo atual"
              keyboardType="numeric"
              value={paymentMethodForm.currentBalance.toString()}
              onChangeText={(text) => setPaymentMethodForm({ 
                ...paymentMethodForm, 
                currentBalance: parseFloat(text) || 0 
              })}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Método Principal</Text>
              <Switch
                value={paymentMethodForm.isPrimary}
                onValueChange={(value) => setPaymentMethodForm({ ...paymentMethodForm, isPrimary: value })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentMethodModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePaymentMethod}
                disabled={!paymentMethodForm.name || !paymentMethodForm.type}
              >
                <Text style={[
                  styles.saveButtonText,
                  (!paymentMethodForm.name || !paymentMethodForm.type) && styles.saveButtonTextDisabled
                ]}>
                  Salvar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
  },
  summaryValueCredit: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryStatText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  actionButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addMethodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethods: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  paymentMethodBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  paymentMethodLimit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    maxHeight: 80,
  },
  typeOption: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  typeOptionTextSelected: {
    color: 'white',
  },
});
