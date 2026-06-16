import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const notifications = await NotificationService.getNotifications(userId);
      return res.status(200).json(successResponse('Notifications retrieved successfully', notifications));
    } catch (error) {
      return next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const notification = await NotificationService.markAsRead(userId, req.params.id as string);
      return res.status(200).json(successResponse('Notification marked as read', notification));
    } catch (error) {
      return next(error);
    }
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const count = await NotificationService.getUnreadCount(userId);
      return res.status(200).json(successResponse('Unread notifications count retrieved', { count }));
    } catch (error) {
      return next(error);
    }
  }
}
