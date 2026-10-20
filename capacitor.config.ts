import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ragafinder.app',
  appName: 'Raga Finder',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    url: 'https://raga-finder-ideapad.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1c1917',
  },
};

export default config;

