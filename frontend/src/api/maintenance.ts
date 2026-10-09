import api from './client';
import { MaintenanceRecord, PaginatedData } from '../types';

export const maintenanceApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: PaginatedData<MaintenanceRecord> }>('/maintenance', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: MaintenanceRecord }>(`/maintenance/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: MaintenanceRecord }>('/maintenance', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; data: MaintenanceRecord }>(`/maintenance/${id}`, data),
};
