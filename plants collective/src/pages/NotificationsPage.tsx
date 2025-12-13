import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, Tag, AlertTriangle, Zap, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/App';
import { notificationService, Notification } from '@/services/notificationService';
import { realtimeSyncService } from '@/services/realtimeSyncService';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();

      // Subscribe to real-time notification changes
      const unsubscribe = realtimeSyncService.subscribeToNotifications(user.id, (payload) => {
        // When notification is added or updated, refresh list
        if (payload.type === 'INSERT' || payload.type === 'UPDATE') {
          fetchNotifications();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await notificationService.getNotifications(user.id);
    setNotifications(data);
    setLoading(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.id) return;
    
    // Mark as read
    if (!notification.is_read) {
      await notificationService.markAsRead(user.id, notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }

    // Navigate to the section, not the external link
    if (notification.link) {
      // If it's an internal route (starts with /), navigate to it
      if (notification.link.startsWith('/')) {
        navigate(notification.link);
      } 
      // If it's a blog notification with external link, go to blogs page instead
      else if (notification.link.startsWith('http') && notification.title.includes('Blog')) {
        navigate('/blogs');
      }
      // For other external links, still navigate to blogs if it's blog-related
      else if (notification.link.startsWith('http')) {
        // Check if notification is about blogs
        if (notification.message.toLowerCase().includes('blog') || 
            notification.message.toLowerCase().includes('article')) {
          navigate('/blogs');
        } else {
          // For other external links, navigate to home
          navigate('/');
        }
      }
    } else {
      // No link - navigate to home
      navigate('/');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'promo': return <Tag className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      case 'update': return <Zap className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'promo': return 'bg-purple-100 text-purple-600';
      case 'alert': return 'bg-red-100 text-red-600';
      case 'update': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4 safe-area-top">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          {unreadCount > 0 ? (
            <button 
              onClick={handleMarkAllRead}
              className="p-2 -mr-2 text-green-600"
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  notification.is_read 
                    ? 'border-gray-100 opacity-70' 
                    : 'border-green-200 shadow-md'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

