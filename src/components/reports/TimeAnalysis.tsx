import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface TimeData {
  period: string;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  date: string;
}

interface TimeAnalysisProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  refreshing: boolean;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly';

const { width } = Dimensions.get('window');

export default function TimeAnalysis({ dateRange, refreshing }: TimeAnalysisProps) {
  const { theme, colors } = useTheme();
  const styles = getStyles(theme, colors);
  const { getToken, signOut } = useAuth();
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
    averageDaily: 0,
    bestDay: null as TimeData | null,
    worstDay: null as TimeData | null,
  });

  useEffect(() => {
    loadTimeAnalysis();
  }, [dateRange, refreshing, selectedPeriod]);

  const loadTimeAnalysis = async () => {
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
        period: selectedPeriod,
      });

      const response = await api.get(`/reports/time-analysis?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTimeData(response.data.periods);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Erro ao carregar análise temporal:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        await signOut();
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a análise temporal');
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

  const formatPeriod = (period: string, date: string) => {
    const dateObj = new Date(date);
    switch (selectedPeriod) {
      case 'daily':
        return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case 'weekly':
        return `Semana ${period}`;
      case 'monthly':
        return dateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      default:
        return period;
    }
  };

  const getMaxValue = () => {
    const values = timeData.flatMap(item => [Math.abs(item.income), Math.abs(item.expenses)]);
    return Math.max(...values, 1);
  };

  const renderChart = () => {
    if (timeData.length === 0) return null;

    const maxValue = getMaxValue();
    const chartWidth = width - 32;
    const barWidth = Math.max((chartWidth - 40) / timeData.length - 8, 20);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartContainer}>
        <View style={styles.chart}>
          {timeData.map((item, index) => {
            const incomeHeight = (Math.abs(item.income) / maxValue) * 120;
            const expenseHeight = (Math.abs(item.expenses) / maxValue) * 120;

            return (
              <View key={index} style={[styles.chartBar, { width: barWidth }]}>
                <View style={styles.barContainer}>
                  <View style={[styles.incomeBar, { height: incomeHeight }]} />
                  <View style={[styles.expenseBar, { height: expenseHeight }]} />
                </View>
                <Text style={styles.chartLabel} numberOfLines={1}>
                  {formatPeriod(item.period, item.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="trending-up" size={48} color={colors.textSecondary} />
        <Text style={styles.loadingText}>Carregando análise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros de Período */}
      <View style={styles.periodContainer}>
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {timeData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhum dado temporal encontrado</Text>
          <Text style={styles.emptySubtext}>
            Adicione transações para ver a análise temporal
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Resumo */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Resumo do Período</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Receitas</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {formatCurrency(summary.totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Despesas</Text>
                <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                  {formatCurrency(summary.totalExpenses)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Saldo Líquido</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: summary.totalBalance >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {formatCurrency(summary.totalBalance)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Média Diária</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(summary.averageDaily)}
                </Text>
              </View>
            </View>
          </View>

          {/* Gráfico */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Evolução Temporal</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Receitas</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>Despesas</Text>
              </View>
            </View>
            {renderChart()}
          </View>

          {/* Detalhes por Período */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Detalhes por Período</Text>
            {timeData.map((item, index) => (
              <View key={index} style={styles.periodDetailCard}>
                <View style={styles.periodDetailHeader}>
                  <Text style={styles.periodDetailTitle}>
                    {formatPeriod(item.period, item.date)}
                  </Text>
                  <Text style={styles.periodDetailTransactions}>
                    {item.transactionCount} transações
                  </Text>
                </View>
                <View style={styles.periodDetailValues}>
                  <View style={styles.periodDetailValue}>
                    <Text style={styles.periodDetailLabel}>Receitas</Text>
                    <Text style={[styles.periodDetailAmount, { color: '#4CAF50' }]}>
                      {formatCurrency(item.income)}
                    </Text>
                  </View>
                  <View style={styles.periodDetailValue}>
                    <Text style={styles.periodDetailLabel}>Despesas</Text>
                    <Text style={[styles.periodDetailAmount, { color: '#F44336' }]}>
                      {formatCurrency(item.expenses)}
                    </Text>
                  </View>
                  <View style={styles.periodDetailValue}>
                    <Text style={styles.periodDetailLabel}>Saldo</Text>
                    <Text style={[
                      styles.periodDetailAmount,
                      { color: item.balance >= 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {formatCurrency(item.balance)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  periodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
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
  content: {
    flex: 1,
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
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: 20,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  incomeBar: {
    width: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    minHeight: 2,
  },
  expenseBar: {
    width: 8,
    backgroundColor: '#F44336',
    borderRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  periodDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  periodDetailTransactions: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  periodDetailValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodDetailValue: {
    alignItems: 'center',
  },
  periodDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  periodDetailAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
