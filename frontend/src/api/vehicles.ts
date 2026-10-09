import api from './client';
import { Vehicle, VehicleCategory, PaginatedData } from '../types';

export const vehiclesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: PaginatedData<Vehicle> }>('/vehicles', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`),

  checkAvailability: (id: string, pickupDate: string, returnDate: string) =>
    api.get<{ success: boolean; data: { available: boolean } }>(`/vehicles/${id}/availability`, {
      params: { pickupDate, returnDate },
    }),

  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: Vehicle }>('/vehicles', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`, data),

  archive: (id: string) =>
    api.delete(`/vehicles/${id}`),

  listCategories: () =>
    api.get<{ success: boolean; data: VehicleCategory[] }>('/vehicles/categories'),

  createCategory: (data: { name: string; description?: string }) =>
    api.post<{ success: boolean; data: VehicleCategory }>('/vehicles/categories', data),
};
