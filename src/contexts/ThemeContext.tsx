import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: typeof lightTheme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Determinar tema atual baseado no modo selecionado
  const getCurrentTheme = (mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'system') {
      return systemTheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  };

  const currentTheme = getCurrentTheme(themeMode);
  const colors = currentTheme === 'dark' ? darkTheme : lightTheme;
  const isDark = currentTheme === 'dark';

  // Carregar preferência salva
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Salvar preferência quando mudar
  useEffect(() => {
    if (!isLoading) {
      saveThemePreference(themeMode);
    }
  }, [themeMode, isLoading]);

  async function loadThemePreference() {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Erro ao carregar preferência de tema:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveThemePreference(mode: ThemeMode) {
    try {
      await AsyncStorage.setItem('theme_preference', mode);
    } catch (error) {
      console.error('Erro ao salvar preferência de tema:', error);
    }
  }

  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
  }

  function toggleTheme() {
    const newMode = currentTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }

  const value: ThemeContextType = {
    theme: currentTheme,
    colors,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  if (isLoading) {
    return null; // ou um componente de loading
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
