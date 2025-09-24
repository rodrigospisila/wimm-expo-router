import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';

export const useTheme = () => {
  const deviceTheme = useColorScheme();
  const isDark = deviceTheme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;
  
  return {
    theme: isDark ? 'dark' : 'light',
    colors,
    isDark,
  };
};
