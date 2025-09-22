#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Limpando cache completo do projeto...');

// Diretórios para limpar
const dirsToClean = [
  'node_modules/.cache',
  '.expo',
  'dist',
  'build',
  '.next',
  'android/app/build',
  'ios/build',
  'web-build'
];

// Arquivos para remover
const filesToRemove = [
  'metro.cache',
  'InternalBytecode.js',
  '.expo/packager-info.json'
];

// Limpar diretórios
dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removendo ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Não foi possível remover ${dir}: ${error.message}`);
    }
  }
});

// Remover arquivos específicos
filesToRemove.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  Removendo ${file}...`);
    try {
      fs.unlinkSync(fullPath);
    } catch (error) {
      console.log(`⚠️  Não foi possível remover ${file}: ${error.message}`);
    }
  }
});

// Comandos para executar
const commands = [
  'npm cache clean --force',
  'npx expo install --fix',
  'npx expo r -c'
];

commands.forEach(command => {
  console.log(`🔧 Executando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.log(`⚠️  Erro ao executar ${command}: ${error.message}`);
  }
});

console.log('✅ Limpeza completa finalizada!');
console.log('📱 Agora execute: npx expo start --clear');
