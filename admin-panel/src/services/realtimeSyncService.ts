/**
 * Real-time Sync Service for Admin Panel
 * 
 * Provides real-time subscriptions to Supabase tables for instant updates
 * when changes are made. Ensures data consistency across all admin panels.
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

