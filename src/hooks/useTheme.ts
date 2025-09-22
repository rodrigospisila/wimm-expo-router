import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';

export const useTheme = () => {
  const deviceTheme = useColorScheme();
  const theme = deviceTheme === 'dark' ? darkTheme : lightTheme;
  return theme;
};
