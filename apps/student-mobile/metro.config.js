const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Merge watchFolders with Expo's defaults instead of replacing
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// Add monorepo node_modules to resolution paths (merge, don't replace)
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Keep Expo's default for hierarchical lookup (false)
// This is important for Expo Go compatibility
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
