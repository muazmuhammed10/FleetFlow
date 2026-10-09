import api from './client';

export interface DriverProfile {
  id: string;
  userId: string;
  licenceNumber: string;
  licenceExpiryDate: string;
  licenceClass?: string;
  experienceYears?: number;
  availability: 'AVAILABLE' | 'ON_ASSIGNMENT' | 'ON_LEAVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  assignments?: {
    id: string;
    bookingId: string;
    assignedAt: string;
    unassignedAt?: string;
    booking?: { bookingReference: string; status: string; pickupDate?: string; returnDate?: string; vehicle?: { make: string; model: string; registrationNumber: string } };
  }[];
}

export const driversApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: { data: DriverProfile[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>('/drivers', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: DriverProfile }>(`/drivers/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<{ success: boolean; data: DriverProfile }>('/drivers', data),

  updateAvailability: (id: string, availability: string) =>
    api.patch(`/drivers/${id}/availability`, { availability }),

  assign: (driverId: string, bookingId: string) =>
    api.post(`/drivers/${driverId}/assign`, { bookingId }),

  unassign: (assignmentId: string) =>
    api.delete(`/drivers/assignments/${assignmentId}`),
};
