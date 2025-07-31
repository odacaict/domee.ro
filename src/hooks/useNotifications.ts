import { useState, useEffect } from 'react';
import { Notification as AppNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { useApp } from '../contexts/AppContext';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useApp();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initNotifications = async () => {
      try {
        setLoading(true);
        
        // Fetch initial notifications
        const data = await notificationService.getUserNotifications(user.id);
        setNotifications(data);

        // Subscribe to real-time updates
        unsubscribe = notificationService.subscribeToNotifications(
          user.id,
          (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show browser notification if permission granted
            if ('Notification' in window && window.Notification.permission === 'granted') {
              new window.Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/logo.png',
              });
            }
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    initNotifications();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    
    try {
      await notificationService.clearAllNotifications(user.id);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window && window.Notification.permission === 'default') {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    refresh: () => user && initNotifications(),
  };
}