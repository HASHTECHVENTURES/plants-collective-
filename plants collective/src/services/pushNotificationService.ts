/**
 * Push Notification Service
 * 
 * Handles registration and management of push notifications for Android devices
 * using Capacitor Push Notifications plugin with Firebase Cloud Messaging (FCM)
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

export interface PushNotificationToken {
  user_id: string;
  device_token: string;
  platform: 'android' | 'ios' | 'web';
  device_id?: string;
}

class PushNotificationService {
  private isInitialized = false;
  private currentToken: string | null = null;

  /**
   * Initialize push notifications
   * Call this when user logs in
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    // Only initialize on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Register with FCM
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        this.currentToken = token.value;
        await this.saveTokenToDatabase(userId, token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for push notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        // You can show a local notification or update UI here
      });

      // Listen for push notification actions (when user taps notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification);
        // Handle navigation or action here
        const data = notification.notification.data;
        if (data?.link) {
          // Navigate to the link
          window.location.href = data.link;
        }
      });

      this.isInitialized = true;
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Save device token to database
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
      
      // Get device ID if available
      const deviceId = await this.getDeviceId();

      // Upsert device token (update if exists, insert if new)
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: userId,
            device_token: token,
            platform: platform,
            device_id: deviceId,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,device_token',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('Error saving device token:', error);
      } else {
        console.log('✅ Device token saved to database');
      }
    } catch (error) {
      console.error('Failed to save device token:', error);
    }
  }

  /**
   * Get device ID (simple implementation)
   */
  private async getDeviceId(): Promise<string | undefined> {
    try {
      // You can use Capacitor Preferences to store a unique device ID
      const { Preferences } = await import('@capacitor/preferences');
      let deviceId = await Preferences.get({ key: 'device_id' });
      
      if (!deviceId.value) {
        // Generate a simple device ID
        deviceId.value = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await Preferences.set({ key: 'device_id', value: deviceId.value });
      }
      
      return deviceId.value;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return undefined;
    }
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Cleanup (call when user logs out)
   */
  async cleanup(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await PushNotifications.removeAllListeners();
        this.isInitialized = false;
        this.currentToken = null;
      } catch (error) {
        console.error('Error cleaning up push notifications:', error);
      }
    }
  }
}

export const pushNotificationService = new PushNotificationService();

