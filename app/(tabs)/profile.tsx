import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { 
  Title, 
  Text, 
  Card, 
  Button, 
  Snackbar,
  List,
  Switch,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  function showSnackbar(message: string) {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }

  async function handleSignOut() {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              showSnackbar('Logout realizado com sucesso');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        },
      ]
    );
  }

  function handleThemeChange(mode: 'light' | 'dark' | 'system') {
    setThemeMode(mode);
    showSnackbar(`Tema alterado para ${mode === 'system' ? 'automático' : mode === 'dark' ? 'escuro' : 'claro'}`);
  }

  function getThemeLabel(mode: string) {
    switch (mode) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'system': return 'Automático';
      default: return 'Automático';
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
            </View>
          </View>
        </View>

        {/* Configurações de Tema */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="palette" size={24} color={colors.primary} />
              <Title style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Title>
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Personalize a aparência do aplicativo
            </Text>

            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { borderColor: colors.border },
                  themeMode === 'light' && { borderColor: colors.primary, backgroundColor: colors.primarySurface }
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <MaterialIcons 
                  name="light-mode" 
                  size={24} 
                  color={themeMode === 'light' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'light' ? colors.primary : colors.text }
                ]}>
                  Claro
                </Text>
                <RadioButton
                  value="light"
                  status={themeMode === 'light' ? 'checked' : 'unchecked'}
                  onPress={() => handleThemeChange('light')}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { borderColor: colors.border },
                  themeMode === 'dark' && { borderColor: colors.primary, backgroundColor: colors.primarySurface }
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <MaterialIcons 
                  name="dark-mode" 
                  size={24} 
                  color={themeMode === 'dark' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'dark' ? colors.primary : colors.text }
                ]}>
                  Escuro
                </Text>
                <RadioButton
                  value="dark"
                  status={themeMode === 'dark' ? 'checked' : 'unchecked'}
                  onPress={() => handleThemeChange('dark')}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { borderColor: colors.border },
                  themeMode === 'system' && { borderColor: colors.primary, backgroundColor: colors.primarySurface }
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <MaterialIcons 
                  name="settings-brightness" 
                  size={24} 
                  color={themeMode === 'system' ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'system' ? colors.primary : colors.text }
                ]}>
                  Automático
                </Text>
                <RadioButton
                  value="system"
                  status={themeMode === 'system' ? 'checked' : 'unchecked'}
                  onPress={() => handleThemeChange('system')}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.themeDescription, { color: colors.textTertiary }]}>
              {themeMode === 'system' 
                ? 'O tema será ajustado automaticamente baseado nas configurações do seu dispositivo'
                : `Tema ${getThemeLabel(themeMode).toLowerCase()} ativo`
              }
            </Text>
          </Card.Content>
        </Card>

        {/* Configurações Gerais */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="settings" size={24} color={colors.primary} />
              <Title style={[styles.sectionTitle, { color: colors.text }]}>Configurações</Title>
            </View>

            <List.Item
              title="Notificações"
              description="Gerenciar notificações do app"
              left={(props) => <List.Icon {...props} icon="notifications" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => showSnackbar('Configurações de notificação em desenvolvimento')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider style={{ backgroundColor: colors.divider }} />

            <List.Item
              title="Segurança"
              description="Alterar senha e configurações de segurança"
              left={(props) => <List.Icon {...props} icon="security" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => showSnackbar('Configurações de segurança em desenvolvimento')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider style={{ backgroundColor: colors.divider }} />

            <List.Item
              title="Exportar Dados"
              description="Baixar seus dados em formato CSV"
              left={(props) => <List.Icon {...props} icon="download" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => showSnackbar('Exportação de dados em desenvolvimento')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Sobre */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="info" size={24} color={colors.primary} />
              <Title style={[styles.sectionTitle, { color: colors.text }]}>Sobre</Title>
            </View>

            <List.Item
              title="Versão do App"
              description="1.0.0 (Beta)"
              left={(props) => <List.Icon {...props} icon="info" color={colors.textSecondary} />}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider style={{ backgroundColor: colors.divider }} />

            <List.Item
              title="Termos de Uso"
              description="Leia nossos termos e condições"
              left={(props) => <List.Icon {...props} icon="description" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => showSnackbar('Termos de uso em desenvolvimento')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider style={{ backgroundColor: colors.divider }} />

            <List.Item
              title="Política de Privacidade"
              description="Como tratamos seus dados"
              left={(props) => <List.Icon {...props} icon="privacy-tip" color={colors.textSecondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />}
              onPress={() => showSnackbar('Política de privacidade em desenvolvimento')}
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Logout */}
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleSignOut}
              style={[styles.logoutButton, { borderColor: colors.error }]}
              labelStyle={{ color: colors.error }}
              icon="logout"
            >
              Sair da Conta
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: colors.surface }}
      >
        <Text style={{ color: colors.text }}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeOptions: {
    gap: 12,
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  themeDescription: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
