const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolver problemas com symlinks e cache
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configurar cache
config.resetCache = true;

// Resolver problemas com InternalBytecode.js
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {
  // Evitar problemas com módulos duplicados
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
  'react': path.resolve(__dirname, 'node_modules/react'),
};

// Configurações adicionais para estabilidade
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Ignorar arquivos problemáticos
config.resolver.blacklistRE = /InternalBytecode\.js$/;

module.exports = config;
