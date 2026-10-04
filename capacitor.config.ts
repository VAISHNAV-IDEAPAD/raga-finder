import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ragafinder.app',
  appName: 'Raga Finder',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // When your Vercel/live URL is ready, set it below to connect live backend & AI:
    // url: 'https://raga-finder.vercel.app',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1c1917',
  },
};

export default config;

