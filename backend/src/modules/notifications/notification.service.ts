import { NotificationType } from '@prisma/client';
import prisma from '../../config/database';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        bookingId: input.bookingId,
        metadata: input.metadata as object | undefined,
      },
    });
  } catch {
    // Never let a notification failure break the main workflow
    return null;
  }
}

export async function getUserNotifications(
  userId: string,
  page = 1,
  limit = 20,
  unreadOnly = false
) {
  const skip = (page - 1) * limit;
  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    data: notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    unreadCount,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw { status: 404, message: 'Notification not found' };
  if (notification.userId !== userId) throw { status: 403, message: 'Access denied' };

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
