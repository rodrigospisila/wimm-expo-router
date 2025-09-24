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

interface InstallmentData {
  id: number;
  description: string;
  totalAmount: number;
  installmentCount: number;
  paidInstallments: number;
  remainingAmount: number;
  nextDueDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
  installmentType: 'FIXED' | 'CREDIT_CARD';
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  wallet?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  installments: Array<{
    id: number;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
  }>;
}

interface InstallmentSummary {
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  nextPayments: Array<{
    id: number;
    description: string;
    amount: number;
    dueDate: string;
    installmentNumber: number;
    totalInstallments: number;
  }>;
}

interface InstallmentReportProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshing: boolean;
}

export default function InstallmentReport({ dateRange, refreshing }: InstallmentReportProps) {
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
  const { getToken, signOut } = useAuth();
  const [installments, setInstallments] = useState<InstallmentData[]>([]);
  const [summary, setSummary] = useState<InstallmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [expandedInstallments, setExpandedInstallments] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInstallmentReport();
  }, [dateRange, refreshing, selectedStatus]);

  const loadInstallmentReport = async () => {
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
        ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
      });

      const response = await api.get(`/reports/installments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInstallments(response.data.installments);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Erro ao carregar relatório de parcelas:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar o relatório de parcelas');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'OVERDUE':
        return '#F44336';
      case 'PAID':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativa';
      case 'COMPLETED':
        return 'Concluída';
      case 'OVERDUE':
        return 'Em Atraso';
      case 'PAID':
        return 'Paga';
      case 'PENDING':
        return 'Pendente';
      default:
        return status;
    }
  };

  const toggleInstallmentExpansion = (installmentId: number) => {
    const newExpanded = new Set(expandedInstallments);
    if (newExpanded.has(installmentId)) {
      newExpanded.delete(installmentId);
    } else {
      newExpanded.add(installmentId);
    }
    setExpandedInstallments(newExpanded);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="card" size={48} color={colors.textSecondary} />
        <Text style={styles.loadingText}>Carregando parcelas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumo */}
      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Resumo das Parcelas</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalActive}</Text>
              <Text style={styles.summaryLabel}>Ativas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalCompleted}</Text>
              <Text style={styles.summaryLabel}>Concluídas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>{summary.totalOverdue}</Text>
              <Text style={styles.summaryLabel}>Em Atraso</Text>
            </View>
          </View>
          <View style={styles.amountSummary}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Valor Pendente</Text>
              <Text style={[styles.amountValue, { color: '#FF9800' }]}>
                {formatCurrency(summary.totalPendingAmount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Valor Pago</Text>
              <Text style={[styles.amountValue, { color: '#4CAF50' }]}>
                {formatCurrency(summary.totalPaidAmount)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Próximos Pagamentos */}
      {summary && summary.nextPayments.length > 0 && (
        <View style={styles.nextPaymentsContainer}>
          <Text style={styles.sectionTitle}>Próximos Pagamentos</Text>
          {summary.nextPayments.slice(0, 5).map((payment) => (
            <View key={payment.id} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentDescription}>{payment.description}</Text>
                <Text style={styles.paymentDetails}>
                  {payment.installmentNumber}/{payment.totalInstallments} • {formatDate(payment.dueDate)}
                </Text>
              </View>
              <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Filtros de Status */}
      <View style={styles.filterContainer}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'OVERDUE'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status === 'ALL' ? 'Todas' : getStatusText(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {installments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma parcela encontrada</Text>
          <Text style={styles.emptySubtext}>
            Crie parcelas para ver o relatório detalhado
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.installmentsList} showsVerticalScrollIndicator={false}>
          {installments.map((installment) => (
            <View key={installment.id} style={styles.installmentCard}>
              <TouchableOpacity
                style={styles.installmentHeader}
                onPress={() => toggleInstallmentExpansion(installment.id)}
              >
                <View style={styles.installmentInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: installment.category.color }]}>
                    <Ionicons name={installment.category.icon as any} size={16} color="white" />
                  </View>
                  <View style={styles.installmentDetails}>
                    <Text style={styles.installmentDescription}>{installment.description}</Text>
                    <Text style={styles.installmentProgress}>
                      {installment.paidInstallments}/{installment.installmentCount} parcelas • {installment.category.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.installmentAmount}>
                  <Text style={styles.installmentTotalAmount}>
                    {formatCurrency(installment.totalAmount)}
                  </Text>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(installment.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(installment.status) }]}>
                      {getStatusText(installment.status)}
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedInstallments.has(installment.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {/* Detalhes das Parcelas */}
              {expandedInstallments.has(installment.id) && (
                <View style={styles.installmentDetailsContainer}>
                  <View style={styles.progressBar}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${(installment.paidInstallments / installment.installmentCount) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {((installment.paidInstallments / installment.installmentCount) * 100).toFixed(0)}% concluído
                    </Text>
                  </View>

                  <View style={styles.installmentsList}>
                    {installment.installments.map((inst) => (
                      <View key={inst.id} style={styles.installmentItem}>
                        <View style={styles.installmentItemInfo}>
                          <Text style={styles.installmentNumber}>
                            Parcela {inst.installmentNumber}
                          </Text>
                          <Text style={styles.installmentDueDate}>
                            Vencimento: {formatDate(inst.dueDate)}
                          </Text>
                        </View>
                        <View style={styles.installmentItemAmount}>
                          <Text style={styles.installmentItemValue}>
                            {formatCurrency(inst.amount)}
                          </Text>
                          <View style={[styles.installmentStatus, { backgroundColor: getStatusColor(inst.status) }]}>
                            <Text style={styles.installmentStatusText}>
                              {getStatusText(inst.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
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
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  amountSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  amountItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextPaymentsContainer: {
    marginBottom: 24,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  paymentDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
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
  installmentsList: {
    flex: 1,
  },
  installmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  installmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  installmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  installmentDetails: {
    flex: 1,
  },
  installmentDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  installmentProgress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  installmentAmount: {
    alignItems: 'flex-end',
  },
  installmentTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  installmentDetailsContainer: {
    backgroundColor: colors.background,
    paddingTop: 16,
  },
  progressBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  installmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  installmentItemInfo: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  installmentDueDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  installmentItemAmount: {
    alignItems: 'flex-end',
  },
  installmentItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  installmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  installmentStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
});
