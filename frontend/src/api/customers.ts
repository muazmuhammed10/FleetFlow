import api from './client';
import { CustomerProfile, PaginatedData } from '../types';

export const customersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: PaginatedData<CustomerProfile> }>('/customers', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: CustomerProfile }>(`/customers/${id}`),

  getMyProfile: () =>
    api.get<{ success: boolean; data: CustomerProfile }>('/customers/me'),

  updateMyProfile: (data: Record<string, unknown>) =>
    api.put<{ success: boolean; data: CustomerProfile }>('/customers/me', data),

  verify: (id: string) =>
    api.post(`/customers/${id}/verify`),

  updateStatus: (userId: string, status: string) =>
    api.patch(`/customers/users/${userId}/status`, { status }),
};
