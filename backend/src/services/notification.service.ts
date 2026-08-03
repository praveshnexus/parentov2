import { prisma } from '../config/prisma';
import { Prisma, NotificationType } from '@prisma/client';

interface CreateNotificationDto {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

export const NotificationService = {
  async create(dto: CreateNotificationDto) {
    const notification = await prisma.notification.create({ data: dto });

    // Emit via socket if user is connected
    const { io } = await import('../config/socket').catch(() => ({ io: null }));
    if (io) {
      io.to(`user:${dto.recipientId}`).emit('notification', notification);
    }

    return notification;
  },

  async getAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.notification.count({ where: { recipientId: userId } }),
      prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount };
  },

  async markRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  },
};
