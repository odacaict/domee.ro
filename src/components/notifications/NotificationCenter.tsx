import React, { useState, useEffect } from 'react';
import { Bell, Calendar, DollarSign, Star as StarIcon, AlertCircle, X, CheckCircle, BellRing } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification as AppNotification } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    requestPermission 
  } = useNotifications();

  useEffect(() => {
    if (isOpen && 'Notification' in window && window.Notification.permission === 'default') {
      // Show prompt to enable notifications
    }
  }, [isOpen]);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'payment':
        return DollarSign;
      case 'review':
        return StarIcon;
      case 'alert':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getTypeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-emerald-600 bg-emerald-100';
      case 'review':
        return 'text-amber-600 bg-amber-100';
      case 'alert':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `acum ${diffInMinutes} minute`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `acum ${hours} ${hours === 1 ? 'oră' : 'ore'}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `acum ${days} ${days === 1 ? 'zi' : 'zile'}`;
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      // Navigate to action URL
      console.log('Navigate to:', notification.action_url);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert('Notificările au fost activate! Vei primi alerte pentru rezervări și actualizări importante.');
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div
        className={cn(
          'fixed right-0 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-l-2xl shadow-2xl z-50 transform transition-transform duration-300 max-h-[calc(100vh-5rem)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 rounded-tl-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Notificări</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Șterge tot
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Enable Notifications Prompt */}
        {'Notification' in window && window.Notification.permission === 'default' && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start gap-3">
              <BellRing size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Activează notificările
                </p>
                <p className="text-xs text-amber-700 mb-2">
                  Primește alerte pentru rezervări și actualizări importante
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleEnableNotifications}
                  className="text-xs"
                >
                  Activează
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nu ai notificări noi</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 hover:bg-slate-50 transition-colors cursor-pointer',
                      !notification.read && 'bg-amber-50 hover:bg-amber-100'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('p-2 rounded-lg flex-shrink-0', getTypeColor(notification.type))}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-slate-800 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-amber-600 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.action_url && (
                            <span className="text-xs text-amber-600 font-medium">
                              Vezi detalii →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mark All as Read */}
        {notifications.some(n => !n.read) && (
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={markAllAsRead}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
            >
              <CheckCircle size={16} />
              Marchează toate ca citite
            </button>
          </div>
        )}
      </div>
    </>
  );
};