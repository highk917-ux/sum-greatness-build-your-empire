import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sumgreatness.buildyourempire',
  appName: 'SUM GREATNESS: Build Your Empire',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#080705' },
  ios: { backgroundColor: '#080705', contentInset: 'automatic' }
};

export default config;
