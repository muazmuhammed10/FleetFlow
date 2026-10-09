import api from './client';
import { Payment, PaginatedData } from '../types';

export interface InitiatePaymentInput {
  bookingId: string;
  paymentMethod: string;
  cardHolderName?: string;
  cardLastFour?: string;
  collateralType?: string;
  collateralReference?: string;
  collateralNotes?: string;
}

export const paymentsApi = {
  // Customer initiates payment
  initiatePayment: (data: InitiatePaymentInput) =>
    api.post<{ success: boolean; data: Payment; message: string }>('/payments/initiate', data),

  // List payments for a booking
  listForBooking: (bookingId: string) =>
    api.get<{ success: boolean; data: Payment[] }>(`/payments/bookings/${bookingId}`),

  // Staff records payment
  record: (bookingId: string, data: { amount: number; paymentMethod: string; description?: string }) =>
    api.post<{ success: boolean; data: Payment }>(`/payments/bookings/${bookingId}`, data),

  // Refund
  refund: (paymentId: string, data: { amount: number; reason: string }) =>
    api.post(`/payments/${paymentId}/refund`, data),

  // History
  getHistory: (params?: Record<string, unknown>) =>
    api.get<{ success: boolean; data: PaginatedData<Payment> }>('/payments/history', { params }),
};
