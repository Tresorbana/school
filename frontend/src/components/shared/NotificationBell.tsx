import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiClock, FiAlertTriangle, FiX } from 'react-icons/fi';
import { notificationService, type Notification } from '../../services/notificationService';
import { isAuthenticated } from '../../utils/auth';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications when component mounts
  useEffect(() => {
    if (isAuthenticated()) {
      loadNotifications();
      loadUnreadCount();
      
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(() => {
        if (isAuthenticated()) {
          loadUnreadCount();
          if (isOpen) {
            loadNotifications();
          }
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getUserNotifications(20);
      
      if (result.success) {
        setNotifications(result.data || []);
      } else {
        console.error('Failed to load notifications:', result.message);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // If it's an auth error, don't spam the console
      if (error instanceof Error && error.message.includes('No authentication token found')) {
        console.warn('User not authenticated, skipping notification load');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      
      if (result.success) {
        setUnreadCount(result.count || 0);
      } else {
        console.error('Failed to load unread count:', result.message);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
      // If it's an auth error, don't spam the console
      if (error instanceof Error && error.message.includes('No authentication token found')) {
        console.warn('User not authenticated, skipping unread count load');
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);

      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notification_id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();

      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    // For now, just mark as read - we can add navigation logic later
    // if (notification.action_url) {
    //   window.location.href = notification.action_url;
    // }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 1: // high
        return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
      case 2: // normal
        return <FiBell className="w-4 h-4 text-blue-500" />;
      case 3: // low
        return <FiClock className="w-4 h-4 text-gray-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'missed_attendance':
        return 'border-l-red-400 bg-red-50';
      case 'permission_request':
        return 'border-l-orange-400 bg-orange-50';
      case 'permission_response':
        return 'border-l-blue-400 bg-blue-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-main hover:text-main/80 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    } ${getTypeColor(notification.notification_type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.creator_name && (
                            <span className="text-xs text-gray-500">
                              by {notification.creator_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-main rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {/* {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-main hover:text-main/80 font-medium"
              >
                View all notifications
              </button>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;