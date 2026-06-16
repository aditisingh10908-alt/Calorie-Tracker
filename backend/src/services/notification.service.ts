import { prisma } from '../utils/prisma';

export class NotificationService {
  static async createNotification(userId: string, type: string, message: string, scheduledAt?: Date): Promise<any> {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        scheduledAt,
      },
    });
  }

  static async getNotifications(userId: string): Promise<any[]> {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markAsRead(userId: string, id: string): Promise<any> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw { statusCode: 404, message: 'Notification not found' };
    }

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
