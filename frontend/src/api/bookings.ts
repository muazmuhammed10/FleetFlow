import api from './client';
import { Booking, PaginatedData, DashboardStats } from '../types';

export const bookingsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: PaginatedData<Booking> }>('/bookings', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: Booking }>(`/bookings/${id}`),

  create: (data: {
    vehicleId: string;
    pickupDate: string;
    returnDate: string;
    pickupLocation?: string;
    returnLocation?: string;
    includeDriver?: boolean;
    specialRequests?: string;
  }) => api.post<{ success: boolean; data: Booking }>('/bookings', data),

  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/bookings/${id}/status`, { status, reason }),

  getDashboardStats: () =>
    api.get<{ success: boolean; data: DashboardStats }>('/bookings/dashboard-stats'),
};
