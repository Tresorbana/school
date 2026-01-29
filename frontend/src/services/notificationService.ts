import { apiClient } from '../utils/apiClient';

interface Notification {
  notification_id: string;
  target_user: string;
  created_by?: string;
  message: string;
  notification_type: string;
  priority: number; // 1=high, 2=normal, 3=low
  is_read: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string; // Added by backend join
}

interface NotificationSummary {
  total_count: number;
  unread_count: number;
  by_priority: Array<{
    priority: number;
    count: number;
    unread_count: number;
  }>;
  by_type: Array<{
    notification_type: string;
    count: number;
    unread_count: number;
  }>;
}

interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  count?: number;
  summary?: NotificationSummary;
  message?: string;
}

export const notificationService = {
  // Get user notifications with optional filtering
  getUserNotifications: async (limit: number = 20, type?: string): Promise<NotificationResponse> => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (type) params.append('type', type);
      
      const data = await apiClient.get(`/api/notifications/user?${params}`);
      return data;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return { success: false, message: 'Failed to load notifications', data: [] };
    }
  },

  // Get unread count for notification bell
  getUnreadCount: async (): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.get('/api/notifications/unread-count');
      return data;
    } catch (error) {
      console.error('Failed to load unread count:', error);
      return { success: false, message: 'Failed to load unread count', count: 0 };
    }
  },

  // Get notification summary (counts by priority and type)
  getNotificationSummary: async (): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.get('/api/notifications/summary');
      return data;
    } catch (error) {
      console.error('Failed to load notification summary:', error);
      return { success: false, message: 'Failed to load notification summary' };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.post('/api/notifications/mark-read', { notification_id: notificationId });
      return data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, message: 'Failed to mark notification as read' };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.post('/api/notifications/mark-all-read', {});
      return data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, message: 'Failed to mark all notifications as read' };
    }
  },

  // Mark notifications by type as read
  markTypeAsRead: async (type: string): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.post('/api/notifications/mark-type-read', { type });
      return data;
    } catch (error) {
      console.error('Failed to mark type notifications as read:', error);
      return { success: false, message: 'Failed to mark type notifications as read' };
    }
  },

  // Create a new notification (for admin/system use)
  createNotification: async (
    targetUser: string,
    message: string,
    type: string = 'general',
    priority: number = 2
  ): Promise<NotificationResponse> => {
    try {
      const data = await apiClient.post('/api/notifications/create', {
        target_user: targetUser,
        message,
        type,
        priority,
      });
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return { success: false, message: 'Failed to create notification' };
    }
  },

  // Helper function to get priority label
  getPriorityLabel: (priority: number): string => {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Normal';
      case 3: return 'Low';
      default: return 'Unknown';
    }
  },

  // Helper function to get priority color class
  getPriorityColor: (priority: number): string => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-blue-600 bg-blue-50';
      case 3: return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  },
};

export type { Notification, NotificationResponse, NotificationSummary };