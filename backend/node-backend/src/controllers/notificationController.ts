import type { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
    static async getUserNotifications(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const limit = parseInt(req.query.limit as string) || 20;
            const type = req.query.type as string;

            const notifications = await NotificationService.getUserNotifications(user.user_id, limit, type);
            res.json({ success: true, data: notifications });
        } catch (error) {
            console.error('[NotificationController.getUserNotifications]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getUnreadCount(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const { count } = await NotificationService.getUnreadCount(user.user_id);
            res.json({ success: true, count });
        } catch (error) {
            console.error('[NotificationController.getUnreadCount]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getNotificationSummary(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const summary = await NotificationService.getNotificationSummary(user.user_id);
            res.json({ success: true, summary });
        } catch (error) {
            console.error('[NotificationController.getNotificationSummary]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const { notification_id } = req.body;
            if (!notification_id) return res.status(400).json({ success: false, message: 'Notification ID is required' });

            await NotificationService.markAsRead(notification_id);
            res.json({ success: true });
        } catch (error) {
            console.error('[NotificationController.markAsRead]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async markAllAsRead(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            await NotificationService.markAllAsRead(user.user_id);
            res.json({ success: true });
        } catch (error) {
            console.error('[NotificationController.markAllAsRead]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async markTypeAsRead(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const { type } = req.body;
            if (!type) return res.status(400).json({ success: false, message: 'Type is required' });

            await NotificationService.markTypeAsRead(user.user_id, type);
            res.json({ success: true });
        } catch (error) {
            console.error('[NotificationController.markTypeAsRead]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async createNotification(req: Request, res: Response) {
        try {
            const { target_user, message, type, priority } = req.body;
            if (!target_user || !message) return res.status(400).json({ success: false, message: 'Target user and message are required' });

            const creator = (req as any).user;

            const notification = await NotificationService.createNotification({
                target_user,
                message,
                type,
                priority,
                creator_id: creator?.user_id
            });
            res.json({ success: true, data: notification });
        } catch (error) {
            console.error('[NotificationController.createNotification]', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}
