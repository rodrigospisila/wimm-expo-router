#!/usr/bin/env node

/**
 * Script de validação automática para verificar se as correções do modal de categoria estão funcionando
 * Este script analisa o código e verifica se todas as correções foram aplicadas corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando validação das correções do modal de categoria...\n');

// Função para verificar se um arquivo contém determinados padrões
function checkFilePatterns(filePath, patterns, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${fileName}: Arquivo não encontrado`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;

  console.log(`📁 Verificando ${fileName}:`);
  
  patterns.forEach(({ pattern, description, required = true }) => {
    const found = content.includes(pattern);
    const status = found ? '✅' : (required ? '❌' : '⚠️');
    console.log(`  ${status} ${description}`);
    
    if (required && !found) {
      allPassed = false;
    }
  });

  return allPassed;
}

// Padrões para verificar no InstallmentModal.tsx
const installmentModalPatterns = [
  {
    pattern: 'const openCategorySelector = () => {',
    description: 'Função openCategorySelector criada',
    required: true
  },
  {
    pattern: 'const closeCategorySelector = () => {',
    description: 'Função closeCategorySelector criada',
    required: true
  },
  {
    pattern: 'activeOpacity={0.7}',
    description: 'ActiveOpacity configurado no TouchableOpacity',
    required: true
  },
  {
    pattern: 'minHeight: 48',
    description: 'MinHeight configurado para área de toque',
    required: true
  },
  {
    pattern: '🔘 InstallmentModal: openCategorySelector chamada',
    description: 'Logs detalhados de abertura do modal',
    required: true
  },
  {
    pattern: 'setShowCategorySelector(false);',
    description: 'Reset de estado quando modal principal fecha',
    required: true
  },
  {
    pattern: 'console.log(\'📊 InstallmentModal: showCategorySelector antes:\', showCategorySelector);',
    description: 'Log de estado antes da mudança',
    required: true
  },
  {
    pattern: 'setTimeout(() => {',
    description: 'Verificação com delay para debugging',
    required: true
  }
];

// Padrões para verificar no CategorySelectorModal.tsx
const categorySelectorModalPatterns = [
  {
    pattern: 'onRequestClose={handleClose}',
    description: 'onRequestClose configurado no Modal',
    required: true
  },
  {
    pattern: '🎨 CategorySelectorModal: Renderizando modal',
    description: 'Logs de renderização detalhados',
    required: true
  },
  {
    pattern: 'minHeight: 56',
    description: 'MinHeight configurado para itens de categoria',
    required: true
  },
  {
    pattern: 'retryButton',
    description: 'Botão de retry implementado',
    required: true
  },
  {
    pattern: 'setSearchText(\'\');',
    description: 'Reset do texto de busca ao fechar',
    required: true
  },
  {
    pattern: 'activeOpacity={0.7}',
    description: 'ActiveOpacity configurado nos TouchableOpacity',
    required: true
  },
  {
    pattern: 'console.log(\'👁️ CategorySelectorModal: visible no render:\', visible);',
    description: 'Log de visibilidade no render',
    required: true
  }
];

// Verificar arquivos principais
const installmentModalPath = path.join(__dirname, 'src/components/InstallmentModal.tsx');
const categorySelectorModalPath = path.join(__dirname, 'src/components/CategorySelectorModal.tsx');
const testComponentPath = path.join(__dirname, 'src/components/TestCategoryModal.tsx');

console.log('📋 Validando correções implementadas:\n');

// Verificar InstallmentModal
const installmentModalValid = checkFilePatterns(
  installmentModalPath, 
  installmentModalPatterns, 
  'InstallmentModal.tsx'
);

console.log('');

// Verificar CategorySelectorModal
const categorySelectorModalValid = checkFilePatterns(
  categorySelectorModalPath, 
  categorySelectorModalPatterns, 
  'CategorySelectorModal.tsx'
);

console.log('');

// Verificar se o componente de teste existe
const testComponentExists = fs.existsSync(testComponentPath);
console.log(`📁 Verificando TestCategoryModal.tsx:`);
console.log(`  ${testComponentExists ? '✅' : '❌'} Componente de teste criado`);

console.log('');

// Verificar se os arquivos de documentação existem
const docsExist = {
  corrections: fs.existsSync(path.join(__dirname, '../CORRECOES_MODAL_CATEGORIA.md')),
  testGuide: fs.existsSync(path.join(__dirname, '../GUIA_TESTE_MODAL_CATEGORIA.md')),
  testScript: fs.existsSync(path.join(__dirname, 'test-category-modal.js'))
};

console.log(`📁 Verificando documentação:`);
console.log(`  ${docsExist.corrections ? '✅' : '❌'} Documentação de correções`);
console.log(`  ${docsExist.testGuide ? '✅' : '❌'} Guia de teste`);
console.log(`  ${docsExist.testScript ? '✅' : '❌'} Script de teste`);

console.log('');

// Resumo final
const allValid = installmentModalValid && categorySelectorModalValid && testComponentExists;

console.log('📊 RESUMO DA VALIDAÇÃO:');
console.log('');

if (allValid) {
  console.log('✅ TODAS AS CORREÇÕES FORAM APLICADAS CORRETAMENTE!');
  console.log('');
  console.log('🎯 Próximos passos:');
  console.log('  1. Execute o app em um emulador ou dispositivo');
  console.log('  2. Siga o guia de teste (GUIA_TESTE_MODAL_CATEGORIA.md)');
  console.log('  3. Verifique os logs no console durante o teste');
  console.log('  4. Confirme que o modal de categoria abre corretamente');
  console.log('');
  console.log('🔍 Para debugging detalhado:');
  console.log('  - Abra o React Native Debugger');
  console.log('  - Monitore os logs que começam com 🔘, 📊, ✅');
  console.log('  - Use o TestCategoryModal para testes isolados');
} else {
  console.log('❌ ALGUMAS CORREÇÕES ESTÃO FALTANDO!');
  console.log('');
  console.log('🔧 Ações necessárias:');
  
  if (!installmentModalValid) {
    console.log('  - Revisar InstallmentModal.tsx');
  }
  
  if (!categorySelectorModalValid) {
    console.log('  - Revisar CategorySelectorModal.tsx');
  }
  
  if (!testComponentExists) {
    console.log('  - Criar TestCategoryModal.tsx');
  }
  
  console.log('  - Executar novamente este script após as correções');
}

console.log('');

// Verificação adicional: estrutura do projeto
console.log('📁 Verificando estrutura do projeto:');

const requiredPaths = [
  'src/components',
  'src/services',
  'src/contexts',
  'src/hooks',
  'app/(tabs)'
];

requiredPaths.forEach(reqPath => {
  const fullPath = path.join(__dirname, reqPath);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${reqPath}`);
});

console.log('');

// Verificação de dependências no package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('📦 Verificando dependências críticas:');
  
  const criticalDeps = [
    '@expo/vector-icons',
    'react-native',
    'expo-router'
  ];
  
  criticalDeps.forEach(dep => {
    const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
    const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
    const exists = hasInDeps || hasInDevDeps;
    console.log(`  ${exists ? '✅' : '❌'} ${dep}`);
  });
}

console.log('');
console.log('🏁 Validação concluída!');

// Exit code baseado no resultado
process.exit(allValid ? 0 : 1);
