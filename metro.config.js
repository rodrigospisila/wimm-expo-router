const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Resolver problemas com symlinks e cache
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configurar cache
config.resetCache = true;

module.exports = config;
