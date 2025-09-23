import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  FAB,
  Chip,
  IconButton,
  Searchbar,
  Menu,
  Button,
  Portal,
  Modal,
  TextInput,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { walletService } from '../../src/services/api';

interface Wallet {
  id: number;
  name: string;
  type: string;
  currentBalance: number;
  color: string;
  icon: string;
  isActive: boolean;
  description?: string;
  transactionsCount: number;
  lastTransactionDate?: string;
}

const walletTypes = [
  { value: 'ALL', label: 'Todas' },
  { value: 'CHECKING_ACCOUNT', label: 'Conta Corrente' },
  { value: 'SAVINGS_ACCOUNT', label: 'Poupança' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'INVESTMENT', label: 'Investimento' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'OTHER', label: 'Outros' },
];

const walletIcons: Record<string, string> = {
  CHECKING_ACCOUNT: 'bank',
  SAVINGS_ACCOUNT: 'piggy-bank',
  CASH: 'cash',
  INVESTMENT: 'trending-up',
  CREDIT_CARD: 'credit-card',
  OTHER: 'wallet',
};

export default function WalletsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING_ACCOUNT',
    initialBalance: '0',
    description: '',
    color: '#4CAF50',
    icon: 'wallet',
  });

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    filterWallets();
  }, [wallets, searchQuery, selectedType]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await walletService.getAll(selectedType !== 'ALL' ? selectedType : undefined);
      setWallets(response);
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
      Alert.alert('Erro', 'Não foi possível carregar as carteiras');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  };

  const filterWallets = () => {
    let filtered = wallets;

    if (searchQuery) {
      filtered = filtered.filter(wallet =>
        wallet.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(wallet => wallet.type === selectedType);
    }

    setFilteredWallets(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getWalletTypeLabel = (type: string) => {
    return walletTypes.find(t => t.value === type)?.label || type;
  };

  const openCreateModal = () => {
    setEditingWallet(null);
    setFormData({
      name: '',
      type: 'CHECKING_ACCOUNT',
      initialBalance: '0',
      description: '',
      color: '#4CAF50',
      icon: 'wallet',
    });
    setModalVisible(true);
  };

  const openEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      initialBalance: wallet.currentBalance.toString(),
      description: wallet.description || '',
      color: wallet.color,
      icon: wallet.icon,
    });
    setModalVisible(true);
  };

  const handleSaveWallet = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Erro', 'Nome da carteira é obrigatório');
        return;
      }

      const walletData = {
        name: formData.name.trim(),
        type: formData.type,
        initialBalance: parseFloat(formData.initialBalance) || 0,
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
      };

      if (editingWallet) {
        await walletService.update(editingWallet.id, {
          ...walletData,
          currentBalance: parseFloat(formData.initialBalance) || 0,
        });
        Alert.alert('Sucesso', 'Carteira atualizada com sucesso');
      } else {
        await walletService.create(walletData);
        Alert.alert('Sucesso', 'Carteira criada com sucesso');
      }

      setModalVisible(false);
      loadWallets();
    } catch (error: any) {
      console.error('Erro ao salvar carteira:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao salvar carteira');
    }
  };

  const handleDeleteWallet = async (wallet: Wallet) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a carteira "${wallet.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await walletService.delete(wallet.id);
              Alert.alert('Sucesso', 'Carteira excluída com sucesso');
              loadWallets();
            } catch (error: any) {
              console.error('Erro ao excluir carteira:', error);
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir carteira');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (wallet: Wallet) => {
    try {
      await walletService.toggleActive(wallet.id);
      Alert.alert('Sucesso', `Carteira ${wallet.isActive ? 'desativada' : 'ativada'} com sucesso`);
      loadWallets();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      Alert.alert('Erro', 'Erro ao alterar status da carteira');
    }
  };

  const renderWalletCard = (wallet: Wallet) => (
    <Card key={wallet.id} style={[styles.walletCard, { opacity: wallet.isActive ? 1 : 0.6 }]}>
      <Card.Content>
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
              <Text style={styles.walletIconText}>💳</Text>
            </View>
            <View style={styles.walletDetails}>
              <Text variant="titleMedium" style={styles.walletName}>
                {wallet.name}
              </Text>
              <Chip mode="outlined" compact style={styles.typeChip}>
                {getWalletTypeLabel(wallet.type)}
              </Chip>
            </View>
          </View>
          <Menu
            visible={menuVisible === wallet.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(wallet.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                openEditModal(wallet);
              }}
              title="Editar"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleToggleActive(wallet);
              }}
              title={wallet.isActive ? 'Desativar' : 'Ativar'}
              leadingIcon={wallet.isActive ? 'eye-off' : 'eye'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteWallet(wallet);
              }}
              title="Excluir"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <View style={styles.balanceContainer}>
          <Text variant="headlineSmall" style={[styles.balance, { color: wallet.color }]}>
            {formatCurrency(wallet.currentBalance)}
          </Text>
        </View>

        {wallet.description && (
          <Text variant="bodySmall" style={styles.description}>
            {wallet.description}
          </Text>
        )}

        <View style={styles.walletStats}>
          <Text variant="bodySmall" style={styles.statsText}>
            {wallet.transactionsCount || 0} transações
          </Text>
          {wallet.lastTransactionDate && (
            <Text variant="bodySmall" style={styles.statsText}>
              Última: {new Date(wallet.lastTransactionDate).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Carteiras
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gerencie suas contas e carteiras
        </Text>
      </View>

      <View style={styles.filters}>
        <Searchbar
          placeholder="Buscar carteiras..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilters}>
          {walletTypes.map((type) => (
            <Chip
              key={type.value}
              mode={selectedType === type.value ? 'flat' : 'outlined'}
              selected={selectedType === type.value}
              onPress={() => setSelectedType(type.value)}
              style={styles.typeChip}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Carregando carteiras...</Text>
          </View>
        ) : filteredWallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhuma carteira encontrada
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {searchQuery || selectedType !== 'ALL'
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira carteira para começar'}
            </Text>
            {!searchQuery && selectedType === 'ALL' && (
              <Button mode="contained" onPress={openCreateModal} style={styles.createButton}>
                Criar Primeira Carteira
              </Button>
            )}
          </View>
        ) : (
          filteredWallets.map(renderWalletCard)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openCreateModal}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingWallet ? 'Editar Carteira' : 'Nova Carteira'}
            </Text>

            <TextInput
              label="Nome da Carteira"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <Text variant="labelMedium" style={styles.sectionLabel}>
              Tipo de Carteira
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {walletTypes.slice(1).map((type) => (
                <Chip
                  key={type.value}
                  mode={formData.type === type.value ? 'flat' : 'outlined'}
                  selected={formData.type === type.value}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                  style={styles.typeSelectorChip}
                >
                  {type.label}
                </Chip>
              ))}
            </ScrollView>

            <TextInput
              label={editingWallet ? 'Saldo Atual' : 'Saldo Inicial'}
              value={formData.initialBalance}
              onChangeText={(text) => setFormData({ ...formData, initialBalance: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Descrição (opcional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveWallet}
                style={styles.modalButton}
              >
                {editingWallet ? 'Atualizar' : 'Criar'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  filters: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
  },
  typeFilters: {
    flexDirection: 'row',
  },
  typeChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  createButton: {
    marginTop: 16,
  },
  walletCard: {
    marginBottom: 12,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletIconText: {
    color: '#fff',
    fontSize: 20,
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceContainer: {
    marginBottom: 8,
  },
  balance: {
    fontWeight: 'bold',
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#666',
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeSelectorChip: {
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
