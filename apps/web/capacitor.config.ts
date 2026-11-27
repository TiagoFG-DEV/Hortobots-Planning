import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.org.sesisp.hortobots.planning',
  appName: 'Planner',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#62b300'
    },
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: '#090c09',
      showSpinner: false
    }
  }
};

export default config;
