const fs = require('fs');

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
    
    // Substituir theme.propriedade por colors.propriedade
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
  }
});

console.log('✅ Correção de referências theme concluída!');
