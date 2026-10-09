import api from './client';
import { Notification, PaginatedData } from '../types';

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<{ success: boolean; data: PaginatedData<Notification> & { unreadCount: number } }>(
      '/notifications',
      { params }
    ),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),
};
