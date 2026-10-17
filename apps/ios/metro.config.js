const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
// expo-sqlite's browser preview requires its WASM module and isolation headers.
config.resolver.assetExts.push("wasm");
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  return middleware(req, res, next);
};
module.exports = config;
