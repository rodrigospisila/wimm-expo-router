const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const filesToFix = [
  'app/(tabs)/categories.tsx',
  'app/(tabs)/installments.tsx', 
  'app/(tabs)/launch-v2.tsx',
  'app/(tabs)/launch.tsx',
  'app/(tabs)/reports.tsx',
  'app/(tabs)/transactions.tsx',
  'app/(tabs)/wallets.tsx',
  'app/_layout.tsx'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corrigir uso do useTheme para desestruturação
    content = content.replace(
      /const theme = useTheme\(\);/g,
      'const { theme, colors } = useTheme();'
    );
    
    // Corrigir chamadas getStyles que usam apenas theme
    content = content.replace(
      /const styles = getStyles\(theme\);/g,
      'const styles = getStyles(theme, colors);'
    );
    
    // Corrigir definições de getStyles que recebem apenas theme
    content = content.replace(
      /const getStyles = \(theme: any\) => StyleSheet\.create\(/g,
      'const getStyles = (theme: string, colors: any) => StyleSheet.create('
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
  } else {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
  }
});

console.log('✅ Correção de useTheme concluída!');
