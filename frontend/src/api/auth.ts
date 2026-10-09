import api from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post<{ success: boolean; data: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh', { refreshToken }),

  getMe: () =>
    api.get<{ success: boolean; data: User }>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
    api.put('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string; confirmNewPassword: string }) =>
    api.post('/auth/reset-password', data),
};
