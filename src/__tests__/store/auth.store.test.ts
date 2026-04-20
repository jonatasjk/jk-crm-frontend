import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '@/store/auth.store';
import { server } from '@/test/mocks/server';

const BASE = 'http://localhost:3001/api/v1';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset href — the 401 interceptor sets it to '/login', which corrupts XHR URL resolution
    (window.location as { href: string }).href = 'http://localhost:5173';
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  describe('login', () => {
    it('sets user, token and isAuthenticated on success', async () => {
      const { login } = useAuthStore.getState();
      await login('admin@test.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('test-token');
      expect(state.user).toMatchObject({ email: 'admin@test.com', name: 'Test Admin' });
    });

    it('stores token in localStorage', async () => {
      const { login } = useAuthStore.getState();
      await login('admin@test.com', 'password123');

      expect(localStorage.getItem('crm_token')).toBe('test-token');
    });

    it('throws on authentication failure (401)', async () => {
      server.use(
        http.post(`${BASE}/auth/login`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
        ),
      );

      const { login } = useAuthStore.getState();
      await expect(login('wrong@test.com', 'bad')).rejects.toThrow();
    });

    it('does not mutate state on failure', async () => {
      server.use(
        http.post(`${BASE}/auth/login`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
        ),
      );

      const { login } = useAuthStore.getState();
      try {
        await login('wrong@test.com', 'bad');
      } catch {
        // expected
      }

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('register', () => {
    it('sets user, token and isAuthenticated on success', async () => {
      const { register } = useAuthStore.getState();
      await register('admin@test.com', 'password123', 'Test Admin');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('test-token');
      expect(state.user).not.toBeNull();
    });

    it('stores token in localStorage', async () => {
      const { register } = useAuthStore.getState();
      await register('admin@test.com', 'password123', 'Test Admin');

      expect(localStorage.getItem('crm_token')).toBe('test-token');
    });
  });

  describe('logout', () => {
    it('clears user, token and isAuthenticated', () => {
      useAuthStore.setState({
        user: { id: '1', email: 'a@b.com', name: 'A', role: 'ADMIN' },
        token: 'tok',
        isAuthenticated: true,
      });
      localStorage.setItem('crm_token', 'tok');

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('removes token from localStorage', () => {
      localStorage.setItem('crm_token', 'tok');
      const { logout } = useAuthStore.getState();
      logout();
      expect(localStorage.getItem('crm_token')).toBeNull();
    });
  });
});
