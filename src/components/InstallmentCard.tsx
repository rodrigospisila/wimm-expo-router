import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface InstallmentTransaction {
  id: number;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
  paymentMethod: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  installment: {
    id: number;
    installmentCount: number;
    currentInstallment: number;
  };
  installmentNumber: number;
}

interface InstallmentGroup {
  installmentId: number;
  description: string;
  totalAmount: number;
  installmentCount: number;
  paidInstallments: number;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: string;
  };
  paymentMethod: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  transactions: InstallmentTransaction[];
  type: 'INCOME' | 'EXPENSE';
}

interface InstallmentCardProps {
  group: InstallmentGroup;
  onPress?: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export default function InstallmentCard({ 
  group, 
  onPress, 
  onExpand, 
  isExpanded = false 
}: InstallmentCardProps) {
  // Verificações de segurança para evitar NaN
  const paidInstallments = Math.max(0, group.paidInstallments || 0);
  const installmentCount = Math.max(1, group.installmentCount || 1);
  const progress = Math.min(1, Math.max(0, paidInstallments / installmentCount));
  const remainingInstallments = Math.max(0, installmentCount - paidInstallments);
  
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

  const getProgressColor = () => {
    if (progress === 1) return '#2e7d32'; // Verde - completo
    if (progress >= 0.5) return '#f57c00'; // Laranja - meio caminho
    return '#1976d2'; // Azul - início
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onPress}>
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.leftSection}>
              <View style={[styles.categoryIcon, { backgroundColor: group.category.color }]}>
                <MaterialIcons name={group.category.icon as any} size={20} color="#fff" />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.description}>{group.description}</Text>
                <Text style={styles.details}>
                  {group.category.name} • {group.paymentMethod.name}
                </Text>
              </View>
            </View>
            <View style={styles.rightSection}>
              <Text style={[
                styles.totalAmount,
                { color: group.type === 'INCOME' ? '#2e7d32' : '#d32f2f' }
              ]}>
                {group.type === 'INCOME' ? '+' : ''}{formatCurrency(group.totalAmount)}
              </Text>
              <Text style={styles.installmentInfo}>
                Total em {installmentCount}x
              </Text>
            </View>
          </View>

          {/* Barra de Progresso */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {paidInstallments}/{installmentCount} parcelas pagas
              </Text>
              <Text style={[styles.progressPercentage, { color: getProgressColor() }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar 
              progress={progress} 
              color={getProgressColor()}
              style={styles.progressBar}
            />
            {remainingInstallments > 0 && (
              <Text style={styles.remainingText}>
                {remainingInstallments} parcela{remainingInstallments > 1 ? 's' : ''} restante{remainingInstallments > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Botão de Expandir */}
          {onExpand && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={onExpand}
            >
              <Text style={styles.expandText}>
                {isExpanded ? 'Ocultar' : 'Ver'} detalhes das parcelas
              </Text>
              <MaterialIcons 
                name={isExpanded ? 'expand-less' : 'expand-more'} 
                size={20} 
                color="#2e7d32" 
              />
            </TouchableOpacity>
          )}

          {/* Lista de Parcelas (quando expandido) */}
          {isExpanded && (
            <View style={styles.installmentsList}>
              <Text style={styles.installmentsTitle}>Parcelas:</Text>
              {group.transactions
                .sort((a, b) => a.installmentNumber - b.installmentNumber)
                .map((transaction) => (
                  <View key={transaction.id} style={styles.installmentItem}>
                    <View style={styles.installmentLeft}>
                      <View style={[
                        styles.installmentStatus,
                        { backgroundColor: (transaction.installmentNumber || 0) <= paidInstallments ? '#2e7d32' : '#e0e0e0' }
                      ]}>
                        <Text style={[
                          styles.installmentNumber,
                          { color: (transaction.installmentNumber || 0) <= paidInstallments ? '#fff' : '#666' }
                        ]}>
                          {transaction.installmentNumber || 0}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.installmentDescription}>
                          Parcela {transaction.installmentNumber}/{installmentCount}
                        </Text>
                        <Text style={styles.installmentDate}>
                          {formatDate(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.installmentAmount,
                      { color: group.type === 'INCOME' ? '#2e7d32' : '#d32f2f' }
                    ]}>
                      {group.type === 'INCOME' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 6,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftSection: {
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
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  installmentInfo: {
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  remainingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginRight: 4,
  },
  installmentsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  installmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  installmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  installmentNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  installmentDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  installmentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  installmentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
