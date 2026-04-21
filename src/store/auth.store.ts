import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  logout: () => void;
  clearMustChangePassword: () => void;
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
        return { mustChangePassword: data.user.mustChangePassword };
      },

      logout: () => {
        localStorage.removeItem('crm_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      clearMustChangePassword: () => {
        set((state) => ({
          user: state.user ? { ...state.user, mustChangePassword: false } : null,
        }));
      },
    }),
    {
      name: 'crm-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
