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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import InstallmentModal from '../../src/components/InstallmentModal';

interface Installment {
  id: number;
  description: string;
  totalAmount: number;
  installmentCount: number;
  currentInstallment: number;
  installmentType: 'FIXED' | 'CREDIT_CARD';
  startDate: string;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: 'INCOME' | 'EXPENSE';
  };
  creditCard?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface InstallmentTransaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  walletId: number;
  categoryId: number;
  userId: number;
}

interface InstallmentDetails {
  installment: Installment;
  transactions: InstallmentTransaction[];
  summary: {
    totalAmount: number;
    installmentCount: number;
    installmentAmount: number;
    lastInstallmentAmount: number;
    installmentType: string;
  };
}

export default function InstallmentsScreen() {
  const { getToken, signOut } = useAuth();
  const colors = useTheme();
  const styles = getStyles(colors);

  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    loadInstallments();
  }, []);

  const loadInstallments = async () => {
    try {
      const token = getToken();
      if (!token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      const response = await api.get('/transactions/installments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInstallments(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar parcelas:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Erro ao carregar parcelas');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInstallmentDetails = async (installmentId: number) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await api.get(`/transactions/installments/${installmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedInstallment(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da parcela:', error);
      Alert.alert('Erro', 'Erro ao carregar detalhes da parcela');
    }
  };

  const cancelInstallment = async (installmentId: number) => {
    Alert.alert(
      'Cancelar Parcela',
      'Tem certeza que deseja cancelar esta parcela? Esta ação não pode ser desfeita.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getToken();
              if (!token) return;

              await api.delete(`/transactions/installments/${installmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert('Sucesso', 'Parcela cancelada com sucesso');
              loadInstallments();
              setShowDetailsModal(false);
            } catch (error) {
              console.error('Erro ao cancelar parcela:', error);
              Alert.alert('Erro', 'Erro ao cancelar parcela');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInstallments();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getProgressPercentage = (installment: Installment) => {
    return (installment.currentInstallment / installment.installmentCount) * 100;
  };

  const getStatusText = (installment: Installment) => {
    if (!installment.isActive) return 'Cancelada';
    if (installment.currentInstallment >= installment.installmentCount) return 'Concluída';
    return 'Ativa';
  };

  const getStatusColor = (installment: Installment) => {
    if (!installment.isActive) return colors.error;
    if (installment.currentInstallment >= installment.installmentCount) return colors.success;
    return colors.primary;
  };

  const filteredInstallments = installments.filter(installment => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return installment.isActive && installment.currentInstallment < installment.installmentCount;
    if (filterStatus === 'COMPLETED') return installment.currentInstallment >= installment.installmentCount;
    return true;
  });

  const renderInstallment = ({ item }: { item: Installment }) => {
    const progress = getProgressPercentage(item);
    const statusText = getStatusText(item);
    const statusColor = getStatusColor(item);
    const installmentAmount = item.totalAmount / item.installmentCount;

    return (
      <TouchableOpacity
        style={styles.installmentCard}
        onPress={() => loadInstallmentDetails(item.id)}
      >
        <View style={styles.installmentHeader}>
          <View style={styles.installmentInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: item.category.color }]}>
              <Ionicons name={item.category.icon as any} size={20} color="white" />
            </View>
            <View style={styles.installmentDetails}>
              <Text style={styles.installmentDescription}>{item.description}</Text>
              <Text style={styles.installmentCategory}>{item.category.name}</Text>
              <Text style={styles.installmentType}>
                {item.installmentType === 'FIXED' ? 'Parcela Fixa' : 'Cartão de Crédito'}
              </Text>
            </View>
          </View>
          <View style={styles.installmentAmount}>
            <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
            <Text style={styles.installmentValue}>
              {item.installmentCount}x de {formatCurrency(installmentAmount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {item.currentInstallment} de {item.installmentCount} parcelas pagas
            </Text>
            <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.installmentFooter}>
          <Text style={styles.startDate}>
            Início: {formatDate(item.startDate)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedInstallment || !selectedInstallment.installment) return null;

    const { installment, transactions, summary } = selectedInstallment;

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalhes da Parcela</Text>
            <TouchableOpacity
              onPress={() => cancelInstallment(installment.id)}
              style={styles.modalDeleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Informações Gerais */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Informações Gerais</Text>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Descrição:</Text>
                  <Text style={styles.detailValue}>{installment.description}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoria:</Text>
                  <Text style={styles.detailValue}>{installment.category.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tipo:</Text>
                  <Text style={styles.detailValue}>
                    {installment.installmentType === 'FIXED' ? 'Parcela Fixa' : 'Cartão de Crédito'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valor Total:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(summary.totalAmount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Parcelas:</Text>
                  <Text style={styles.detailValue}>
                    {summary.installmentCount}x de {formatCurrency(summary.installmentAmount)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data de Início:</Text>
                  <Text style={styles.detailValue}>{formatDate(installment.startDate)}</Text>
                </View>
              </View>
            </View>

            {/* Cronograma de Pagamentos */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Cronograma de Pagamentos</Text>
              {transactions.map((transaction, index) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      Parcela {index + 1}/{summary.installmentCount}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.transactionValue}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                    <View style={[
                      styles.transactionStatus,
                      {
                        backgroundColor: index < installment.currentInstallment
                          ? colors.success
                          : colors.textSecondary,
                      },
                    ]}>
                      <Text style={styles.transactionStatusText}>
                        {index < installment.currentInstallment ? 'Pago' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Parcelas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'ALL' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('ALL')}
        >
          <Text style={[styles.filterText, filterStatus === 'ALL' && styles.activeFilterText]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'ACTIVE' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('ACTIVE')}
        >
          <Text style={[styles.filterText, filterStatus === 'ACTIVE' && styles.activeFilterText]}>
            Ativas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'COMPLETED' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('COMPLETED')}
        >
          <Text style={[styles.filterText, filterStatus === 'COMPLETED' && styles.activeFilterText]}>
            Concluídas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Installments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando parcelas...</Text>
        </View>
      ) : filteredInstallments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma parcela encontrada</Text>
          <Text style={styles.emptySubtext}>
            Toque no botão + para criar sua primeira parcela
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInstallments}
          renderItem={renderInstallment}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Installment Modal */}
      <InstallmentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadInstallments();
          setShowCreateModal(false);
        }}
      />

      {/* Details Modal */}
      {renderDetailsModal()}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  installmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  installmentInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  installmentDetails: {
    flex: 1,
  },
  installmentDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  installmentCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  installmentType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  installmentAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  installmentValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  installmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startDate: {
    fontSize: 12,
    color: colors.textSecondary,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalDeleteButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  transactionStatusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
});
