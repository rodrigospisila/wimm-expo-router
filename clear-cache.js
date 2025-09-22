#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache do Expo/Metro...');

const cacheDirs = [
  '.expo',
  'node_modules/.cache',
  '.metro',
  'dist',
  '.next'
];

const cacheFiles = [
  'InternalBytecode.js',
  'metro.cache'
];

// Limpar diretórios de cache
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removendo ${dir}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

// Limpar arquivos de cache
cacheFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removendo ${file}`);
    fs.unlinkSync(fullPath);
  }
});

console.log('✅ Cache limpo com sucesso!');
console.log('💡 Execute: npm run web -- --clear para iniciar limpo');
