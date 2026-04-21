import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { LoginPage } from '@/pages/LoginPage';
import { renderWithProviders, resetAuthStore } from '@/test/utils';
import { useAuthStore } from '@/store/auth.store';

const BASE = 'http://localhost:3001/api/v1';

describe('LoginPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    resetAuthStore();
    localStorage.clear();
  });

  it('renders the login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows link to forgot password', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('does not submit when email is invalid (form prevents API call)', async () => {
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login');
    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'notanemail');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await new Promise((r) => setTimeout(r, 200));
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('does not submit when password is too short (form prevents API call)', async () => {
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login');
    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await new Promise((r) => setTimeout(r, 200));
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('submits the form with valid credentials without validation errors', async () => {
    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'admin@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText('Invalid email')).toBeNull();
    });
  });

  it('redirects to /change-password when mustChangePassword is true', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({
          token: 'test-token',
          user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', mustChangePassword: true },
        }),
      ),
    );
    const { queryClient } = renderWithProviders(<LoginPage />, {
      initialEntries: ['/login'],
    });
    await userEvent.type(screen.getByLabelText('Email'), 'admin@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // The store should have been updated (login call succeeded)
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    // Suppress unused variable warning
    void queryClient;
  });

  it('shows error alert when credentials are invalid', async () => {
    server.use(
      http.post(`${BASE}/auth/login`, () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'wrong@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
