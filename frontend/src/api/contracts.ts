import api from './client';

export interface Contract {
  id: string;
  contractNumber: string;
  bookingId: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  terms?: string;
  signedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    bookingReference: string;
    pickupDate: string;
    returnDate: string;
    totalAmount: number;
    rentalDays: number;
    status: string;
    vehicle?: { make: string; model: string; year: number; registrationNumber: string };
    customerProfile?: {
      user?: { firstName: string; lastName: string; email: string };
    };
  };
}

export const contractsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: { data: Contract[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>('/contracts', { params }),

  get: (id: string) =>
    api.get<{ success: boolean; data: Contract }>(`/contracts/${id}`),

  getByBooking: (bookingId: string) =>
    api.get<{ success: boolean; data: Contract }>(`/contracts/booking/${bookingId}`),

  create: (bookingId: string) =>
    api.post<{ success: boolean; data: Contract }>('/contracts', { bookingId }),

  updateStatus: (id: string, status: string) =>
    api.patch(`/contracts/${id}/status`, { status }),
};
