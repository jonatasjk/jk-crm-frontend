import { api } from './client';

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; name: string }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string }
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload { email: string; token: string; newPassword: string }

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/login', data),

  register: (data: RegisterPayload) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/register', data),

  me: () =>
    api.get<{ user: { id: string; email: string; name: string; role: string } }>('/auth/me'),

  changePassword: (data: ChangePasswordPayload) =>
    api.post<{ success: boolean }>('/auth/change-password', data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<{ success: boolean }>('/auth/reset-password', data),
};
