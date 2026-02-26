const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  // Add extra extensions if needed
  sourceExts: [...config.resolver.sourceExts, "cjs", "env"],
};

module.exports = config;
