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
    console.log('🔵 [PushNotifications] initialize() called for user:', userId);
    
    if (this.isInitialized) {
      console.log('⚠️ [PushNotifications] Already initialized, skipping');
      return;
    }

    // Only initialize on native platforms (Android/iOS)
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log('🔵 [PushNotifications] Platform check:', { isNative, platform });
    
    if (!isNative) {
      console.warn('⚠️ [PushNotifications] Not a native platform - push notifications disabled');
      console.warn('⚠️ [PushNotifications] This only works in the Android/iOS app, not in web browser');
      return;
    }

    try {
      console.log('🔵 [PushNotifications] Checking permissions...');
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      console.log('🔵 [PushNotifications] Current permission status:', permStatus);

      if (permStatus.receive === 'prompt') {
        console.log('🔵 [PushNotifications] Requesting permissions...');
        permStatus = await PushNotifications.requestPermissions();
        console.log('🔵 [PushNotifications] Permission request result:', permStatus);
      }

      if (permStatus.receive !== 'granted') {
        console.error('❌ [PushNotifications] Permission denied:', permStatus);
        console.error('❌ [PushNotifications] User needs to enable notifications in phone Settings');
        return;
      }

      console.log('✅ [PushNotifications] Permissions granted, registering with FCM...');
      // Register with FCM
      await PushNotifications.register();
      console.log('✅ [PushNotifications] Registration request sent to FCM');

      // Listen for registration
      PushNotifications.addListener('registration', async (token) => {
        console.log('✅ [PushNotifications] Registration SUCCESS!');
        console.log('✅ [PushNotifications] FCM Token:', token.value.substring(0, 50) + '...');
        this.currentToken = token.value;
        await this.saveTokenToDatabase(userId, token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ [PushNotifications] Registration ERROR:', JSON.stringify(error));
        console.error('❌ [PushNotifications] Check google-services.json and Firebase setup');
      });

      // Listen for push notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('🔔 [PushNotifications] Notification received (foreground):', notification);
      });

      // Listen for push notification actions (when user taps notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('👆 [PushNotifications] User tapped notification:', notification);
        const data = notification.notification.data;
        if (data?.link) {
          console.log('🔗 [PushNotifications] Navigating to:', data.link);
          window.location.href = data.link;
        }
      });

      this.isInitialized = true;
      console.log('✅ [PushNotifications] Service initialized successfully');
    } catch (error) {
      console.error('❌ [PushNotifications] Failed to initialize:', error);
      console.error('❌ [PushNotifications] Error details:', JSON.stringify(error));
    }
  }

  /**
   * Save device token to database
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      console.log('🔵 [PushNotifications] Saving token to database...');
      const platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
      console.log('🔵 [PushNotifications] Platform:', platform);
      
      // Get device ID if available
      const deviceId = await this.getDeviceId();
      console.log('🔵 [PushNotifications] Device ID:', deviceId);

      // Upsert device token (update if exists, insert if new)
      const { data, error } = await supabase
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
        )
        .select();

      if (error) {
        console.error('❌ [PushNotifications] Error saving device token:', error);
        console.error('❌ [PushNotifications] Error details:', JSON.stringify(error));
      } else {
        console.log('✅ [PushNotifications] Device token saved to database successfully');
        console.log('✅ [PushNotifications] Database record:', data);
      }
    } catch (error) {
      console.error('❌ [PushNotifications] Failed to save device token:', error);
      console.error('❌ [PushNotifications] Exception details:', JSON.stringify(error));
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

