import { api } from './client';

export interface LoginPayload { email: string; password: string }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string }
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload { email: string; token: string; newPassword: string }
export interface InvitePayload { email: string; role?: 'ADMIN' | 'MEMBER' }
export interface AcceptInvitePayload { token: string; name: string; password: string }

export interface AuthUser { id: string; email: string; name: string; role: string; mustChangePassword: boolean }
export interface AuthResponse { token: string; user: AuthUser }

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () =>
    api.get<{ user: AuthUser }>('/auth/me'),

  changePassword: (data: ChangePasswordPayload) =>
    api.post<{ success: boolean }>('/auth/change-password', data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<{ success: boolean }>('/auth/reset-password', data),

  invite: (data: InvitePayload) =>
    api.post<{ message: string }>('/auth/invite', data),

  verifyInvite: (token: string) =>
    api.get<{ email: string; role: string }>(`/auth/verify-invite?token=${encodeURIComponent(token)}`),

  acceptInvite: (data: AcceptInvitePayload) =>
    api.post<AuthResponse>('/auth/accept-invite', data),

  listUsers: () =>
    api.get<{ users: Array<{ id: string; email: string; name: string; role: string; mustChangePassword: boolean; createdAt: string }> }>('/users'),

  deleteUser: (id: string) =>
    api.delete<{ success: boolean }>(`/users/${id}`),
};
