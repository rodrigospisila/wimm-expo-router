import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Text, Card, Button, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Title style={styles.title}>Perfil</Title>
          <Text style={styles.subtitle}>Configurações da conta</Text>
        </View>

        {/* Informações do Usuário */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={48} color="#2e7d32" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Configurações */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Configurações</Title>
            
            <List.Item
              title="Notificações"
              description="Gerenciar alertas e lembretes"
              left={(props) => <List.Icon {...props} icon="notifications" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Segurança"
              description="Biometria e autenticação"
              left={(props) => <List.Icon {...props} icon="security" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Tema"
              description="Aparência do aplicativo"
              left={(props) => <List.Icon {...props} icon="palette" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Backup"
              description="Sincronização de dados"
              left={(props) => <List.Icon {...props} icon="cloud-upload" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        {/* Sobre */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Sobre</Title>
            
            <List.Item
              title="Ajuda"
              description="Central de ajuda e suporte"
              left={(props) => <List.Icon {...props} icon="help" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {}}
            />
            
            <Divider />
            
            <List.Item
              title="Versão"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="info" />}
            />
          </Card.Content>
        </Card>

        {/* Sair */}
        <View style={styles.signOutContainer}>
          <Button
            mode="outlined"
            onPress={handleSignOut}
            icon="logout"
            style={styles.signOutButton}
            textColor="#d32f2f"
          >
            Sair da conta
          </Button>
        </View>
      </ScrollView>
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
  card: {
    margin: 20,
    marginTop: 0,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  signOutContainer: {
    padding: 20,
  },
  signOutButton: {
    borderColor: '#d32f2f',
  },
});
