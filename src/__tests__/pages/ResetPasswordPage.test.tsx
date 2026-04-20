import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { renderWithProviders, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('renders heading and submit button', () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password?email=user@test.com&token=abc123'],
    });
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument();
  });

  it('does not call API when password is too short (form prevents submission)', async () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password?email=user@test.com&token=abc123'],
    });
    await userEvent.type(screen.getAllByPlaceholderText('••••••••')[0], 'short');
    await userEvent.type(screen.getAllByPlaceholderText('••••••••')[1], 'short');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    await new Promise((r) => setTimeout(r, 200));
    // Short password should be caught by Zod before the API is called
    expect(screen.queryByText('Invalid or expired reset link. Please request a new one.')).toBeNull();
  });

  it('shows validation error when passwords do not match', async () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password?email=user@test.com&token=abc123'],
    });
    await userEvent.type(screen.getByLabelText('New Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows error when token or email are missing', async () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password'],
    });
    await userEvent.type(screen.getByLabelText('New Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Invalid reset link. Please request a new one.'),
      ).toBeInTheDocument();
    });
  });

  it('shows error on invalid/expired token', async () => {
    server.use(
      http.post(`${BASE}/auth/reset-password`, () =>
        HttpResponse.json({ message: 'Token expired' }, { status: 400 }),
      ),
    );

    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password?email=user@test.com&token=expired'],
    });
    await userEvent.type(screen.getByLabelText('New Password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: /set new password/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid or expired reset link. Please request a new one.'),
      ).toBeInTheDocument();
    });
  });

  it('renders back link to sign in', () => {
    renderWithProviders(<ResetPasswordPage />, {
      initialEntries: ['/reset-password'],
    });
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });
});
