import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plantscollective.app',
  appName: 'plantscollective',
  version: '1.0.0',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Disable cleartext in production (enable only for local dev)
    cleartext: process.env.NODE_ENV === 'development'
  },
  android: {
    // Enable edge-to-edge display for Android
    backgroundColor: '#ffffff',
    // Allow web view to handle display cutouts
    allowMixedContent: true
  },
  ios: {
    // iOS-specific configurations
    contentInset: 'always',
    // Handle safe areas properly
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      spinnerColor: '#22c55e',
      // Ensure splash screen respects safe areas
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: false
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#22c55e',
      // Overlay webview for proper safe area handling
      overlay: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
