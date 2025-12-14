/**
 * Real-time Sync Service
 * 
 * Provides real-time subscriptions to Supabase tables for instant updates
 * when admin panel makes changes. Ensures data consistency across all devices.
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback<T> = (payload: T) => void;
export type UnsubscribeFunction = () => void;

interface RealtimePayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}

class RealtimeSyncService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to blog posts changes
   */
  subscribeToBlogs(
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = 'blog_posts_changes';
    
    // Remove existing channel if any
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts',
          filter: 'is_published=eq.true'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to notifications for a specific user
   */
  subscribeToNotifications(
    userId: string,
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = `notifications_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    // Subscribe to user_notifications table for this user
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to products carousel changes
   */
  subscribeToProducts(
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = 'products_carousel_changes';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products_carousel'
          // Removed filter - listen to all changes, then filter in callback if needed
        },
        (payload) => {
          console.log('Products carousel real-time event:', payload);
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        console.log('Products carousel subscription status:', status);
        if (err) {
          console.error('Products carousel subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to products_carousel changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to products_carousel. Check if Realtime is enabled for this table.');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to app config changes
   */
  subscribeToAppConfig(
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = 'app_config_changes';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_config'
        },
        (payload) => {
          console.log('App config real-time event:', payload);
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        console.log('App config subscription status:', status);
        if (err) {
          console.error('App config subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to app_config changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to app_config. Check if Realtime is enabled for this table.');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to Gold Meet sessions changes
   */
  subscribeToGoldMeetSessions(
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = 'gold_meet_sessions_changes';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gold_meet_sessions',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to Gold Meet categories changes
   */
  subscribeToGoldMeetCategories(
    callback: RealtimeCallback<RealtimePayload>
  ): UnsubscribeFunction {
    const channelName = 'gold_meet_categories_changes';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gold_meet_categories',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeSyncService = new RealtimeSyncService();



