const fs = require('fs');

const filesToFix = [
  'components/Themed.tsx',
  'src/components/CategoryHierarchy.tsx',
  'src/components/CategoryStatistics.tsx',
  'src/components/InstallmentModal.tsx',
  'src/components/SimpleModalTest.tsx',
  'src/components/TestCategoryModal.tsx',
  'src/components/reports/CategoryReport.tsx',
  'src/components/reports/DashboardOverview.tsx',
  'src/components/reports/InstallmentReport.tsx',
  'src/components/reports/TimeAnalysis.tsx'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corrigir uso do useTheme
    content = content.replace(/const theme = useTheme\(\);/g, 'const { theme, colors } = useTheme();');
    content = content.replace(/const styles = getStyles\(theme\);/g, 'const styles = getStyles(theme, colors);');
    content = content.replace(/const getStyles = \(theme: any\) => StyleSheet\.create\(/g, 'const getStyles = (theme: string, colors: any) => StyleSheet.create(');
    
    // Corrigir referências
    content = content.replace(/theme\.background/g, 'colors.background');
    content = content.replace(/theme\.text/g, 'colors.text');
    content = content.replace(/theme\.primary/g, 'colors.primary');
    content = content.replace(/theme\.secondary/g, 'colors.secondary');
    content = content.replace(/theme\.surface/g, 'colors.surface');
    content = content.replace(/theme\.textSecondary/g, 'colors.textSecondary');
    content = content.replace(/theme\.success/g, 'colors.success');
    content = content.replace(/theme\.error/g, 'colors.error');
    content = content.replace(/theme\.warning/g, 'colors.warning');
    content = content.replace(/theme\.border/g, 'colors.border');
    content = content.replace(/theme\.primaryLight/g, 'colors.primaryLight');
    content = content.replace(/theme\.card/g, 'colors.card');
    content = content.replace(/theme\.notification/g, 'colors.notification');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigido: ${filePath}`);
  } else {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
  }
});

console.log('✅ Correção de componentes concluída!');
