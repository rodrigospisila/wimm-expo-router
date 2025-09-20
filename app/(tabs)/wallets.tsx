import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Text, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function WalletsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Carteiras</Title>
        <Text style={styles.subtitle}>Gerencie suas contas e carteiras</Text>
      </View>

      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <MaterialIcons name="account-balance-wallet" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Funcionalidade em desenvolvimento
          </Text>
          <Text style={styles.emptySubtext}>
            Em breve você poderá gerenciar suas carteiras aqui
          </Text>
        </Card.Content>
      </Card>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  emptyCard: {
    margin: 20,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
