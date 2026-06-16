import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);
router.get('/unread-count', NotificationController.getUnreadCount);

export default router;
