import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MeuBolso',
  slug: 'meubolso',
  scheme: 'meubolso',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.meubolso',
    icon: './assets/icon.png',
  },
  android: {
    package: 'com.meubolso',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F6E56',
    },
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-font',
    'expo-sqlite',
    'expo-asset',
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  },
});
