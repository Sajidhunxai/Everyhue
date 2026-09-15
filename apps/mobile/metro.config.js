const { getDefaultConfig } = require("expo/metro-config");

/** SDK 52+ auto-configures monorepo support — no manual watchFolders needed. */
module.exports = getDefaultConfig(__dirname);
