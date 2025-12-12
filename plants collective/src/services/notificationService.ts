import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'alert' | 'update';
  link: string | null;
  created_at: string;
  is_read?: boolean;
}

export const notificationService = {
  // Get all notifications for a user
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      // Get user's notification entries (only notifications sent to this user)
      const { data: userNotifications } = await supabase
        .from('user_notifications')
        .select('notification_id, is_read')
        .eq('user_id', userId);

      if (!userNotifications || userNotifications.length === 0) {
        return [];
      }

      const notificationIds = userNotifications.map(un => un.notification_id);
      const readMap = new Map(
        userNotifications.map(un => [un.notification_id, un.is_read])
      );

      // Get only notifications that were sent to this user
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .in('id', notificationIds)
        .eq('is_active', true)
        .not('sent_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (notifications || []).map(n => ({
        ...n,
        is_read: readMap.get(n.id) || false
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Get unread notifications for this user
      const { data: unreadNotifications, error } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return unreadNotifications?.length || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_id', notificationId)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('user_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('notification_id', notificationId);
      } else {
        // Insert new
        await supabase
          .from('user_notifications')
          .insert({
            user_id: userId,
            notification_id: notificationId,
            is_read: true,
            read_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId);
      
      for (const notification of notifications) {
        if (!notification.is_read) {
          await this.markAsRead(userId, notification.id);
        }
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }
};

