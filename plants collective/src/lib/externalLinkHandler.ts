// Utility for handling external links properly on Android/iOS
import { Capacitor } from '@capacitor/core';

/**
 * Opens an external URL properly on native platforms (Android/iOS) and web
 * Uses Capacitor Browser plugin on native if available, window.open on web
 */
export const openExternalLink = async (url: string, options?: { target?: string }) => {
  if (!url) {
    console.error('No URL provided to openExternalLink');
    return;
  }

  // Ensure URL is absolute
  const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') 
    ? url 
    : `https://${url}`;

  // On native platforms (Android/iOS), try to use Capacitor Browser
  if (Capacitor.isNativePlatform()) {
    try {
      // Dynamically import Browser plugin
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({
        url: absoluteUrl,
        windowName: '_blank',
        presentationStyle: 'popover', // iOS only
      });
      return;
    } catch (error: any) {
      // If Browser plugin is not installed or fails, use fallback
      // On Android, window.open should work but may show in-app browser
      // Using location.href as more reliable fallback for Android
      if (error.message?.includes('not installed') || error.message?.includes('not found')) {
        // Browser plugin not installed - use location.href for Android
        window.location.href = absoluteUrl;
      } else {
        console.error('Error opening browser:', error);
        // Try window.open as last resort
        window.open(absoluteUrl, options?.target || '_blank', 'noopener,noreferrer');
      }
      return;
    }
  }
  
  // On web, use window.open
  window.open(absoluteUrl, options?.target || '_blank', 'noopener,noreferrer');
};


