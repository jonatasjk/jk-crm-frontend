import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authApi.login({ email, password });
        localStorage.setItem('crm_token', data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
      },

      register: async (email, password, name) => {
        const { data } = await authApi.register({ email, password, name });
        localStorage.setItem('crm_token', data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('crm_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'crm-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
