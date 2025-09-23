import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/contexts/AuthContext';
import DashboardOverview from '../../src/components/reports/DashboardOverview';
import CategoryReport from '../../src/components/reports/CategoryReport';
import TimeAnalysis from '../../src/components/reports/TimeAnalysis';
import InstallmentReport from '../../src/components/reports/InstallmentReport';

type ReportTab = 'dashboard' | 'categories' | 'timeline' | 'installments';

const reportTabs = [
  { id: 'dashboard', title: 'Dashboard', icon: 'analytics' },
  { id: 'categories', title: 'Categorias', icon: 'pie-chart' },
  { id: 'timeline', title: 'Temporal', icon: 'trending-up' },
  { id: 'installments', title: 'Parcelas', icon: 'card' },
] as const;

export default function ReportsScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Primeiro dia do mês atual
    endDate: new Date(), // Hoje
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Os componentes filhos irão se atualizar automaticamente
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTabContent = () => {
    const commonProps = {
      dateRange,
      onDateRangeChange: setDateRange,
      refreshing,
    };

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview {...commonProps} />;
      case 'categories':
        return <CategoryReport {...commonProps} />;
      case 'timeline':
        return <TimeAnalysis {...commonProps} />;
      case 'installments':
        return <InstallmentReport {...commonProps} />;
      default:
        return <DashboardOverview {...commonProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <Text style={styles.subtitle}>
          Análise financeira detalhada
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {reportTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id as ReportTab)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  tabContainer: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeTab: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
