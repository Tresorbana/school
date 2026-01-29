import prisma from '../config/prisma.js';

export class NotificationService {
    static async getUserNotifications(userId: string, limit: number = 20, type?: string) {
        const notifications = await prisma.notification.findMany({
            where: {
                target_user_id: userId,
                ...(type ? { notification_type: type } : {})
            },
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                creator: {
                    select: { first_name: true, last_name: true }
                }
            }
        });

        return notifications.map(n => ({
            notification_id: n.notification_id,
            target_user: n.target_user_id,
            created_by: n.creator_id,
            message: n.message,
            notification_type: n.notification_type,
            priority: n.priority,
            is_read: n.is_read,
            created_at: n.created_at,
            updated_at: n.updated_at,
            creator_name: n.creator ? `${n.creator.first_name} ${n.creator.last_name}` : 'System'
        }));
    }

    static async getUnreadCount(userId: string) {
        const count = await prisma.notification.count({
            where: {
                target_user_id: userId,
                is_read: false
            }
        });
        return { count };
    }

    static async getNotificationSummary(userId: string) {
        const totalCount = await prisma.notification.count({ where: { target_user_id: userId } });
        const unreadCount = await prisma.notification.count({ where: { target_user_id: userId, is_read: false } });

        const priorityCounts = await Promise.all([1, 2, 3].map(async p => {
            const count = await prisma.notification.count({ where: { target_user_id: userId, priority: p } });
            const unread = await prisma.notification.count({ where: { target_user_id: userId, priority: p, is_read: false } });
            return { priority: p, count, unread_count: unread };
        }));

        const byTypeRaw = await prisma.notification.groupBy({
            by: ['notification_type'],
            where: { target_user_id: userId },
            _count: { notification_id: true }
        });

        const typeCounts = await Promise.all(byTypeRaw.map(async t => {
            const count = t._count.notification_id;
            const unread = await prisma.notification.count({
                where: { target_user_id: userId, notification_type: t.notification_type, is_read: false }
            });
            return { notification_type: t.notification_type, count, unread_count: unread };
        }));

        return {
            total_count: totalCount,
            unread_count: unreadCount,
            by_priority: priorityCounts,
            by_type: typeCounts
        };
    }

    static async markAsRead(notificationId: string) {
        await prisma.notification.update({
            where: { notification_id: notificationId },
            data: { is_read: true }
        });
        return { success: true };
    }

    static async markAllAsRead(userId: string) {
        await prisma.notification.updateMany({
            where: { target_user_id: userId, is_read: false },
            data: { is_read: true }
        });
        return { success: true };
    }

    static async markTypeAsRead(userId: string, type: string) {
        await prisma.notification.updateMany({
            where: { target_user_id: userId, notification_type: type, is_read: false },
            data: { is_read: true }
        });
        return { success: true };
    }

    static async createNotification(data: {
        target_user: string,
        message: string,
        type?: string,
        priority?: number,
        creator_id?: string
    }) {
        const notification = await prisma.notification.create({
            data: {
                target_user_id: data.target_user,
                message: data.message,
                notification_type: data.type || 'general',
                priority: data.priority || 2,
                creator_id: data.creator_id || null
            }
        });
        return notification;
    }
}
