import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/user', NotificationController.getUserNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/summary', NotificationController.getNotificationSummary);
router.post('/mark-read', NotificationController.markAsRead);
router.post('/mark-all-read', NotificationController.markAllAsRead);
router.post('/mark-type-read', NotificationController.markTypeAsRead);
router.post('/create', NotificationController.createNotification);

export default router;
