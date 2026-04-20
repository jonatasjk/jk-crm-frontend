import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { renderWithProviders, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('renders the page and form', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByText('Forgot password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows link back to sign in', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('does not call API when email is invalid', async () => {
    // Form validation prevents submission — no success or error message should appear
    renderWithProviders(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'notvalid');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await new Promise((r) => setTimeout(r, 200));
    // Neither success nor API-error should appear (validation blocked submission)
    expect(screen.queryByText('Reset link sent to your email')).toBeNull();
    expect(screen.queryByText('Something went wrong. Please try again.')).toBeNull();
  });

  it('shows success message on valid email submission', async () => {
    renderWithProviders(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText('Reset link sent to your email')).toBeInTheDocument();
    });
  });

  it('shows error message when request fails', async () => {
    server.use(
      http.post(`${BASE}/auth/forgot-password`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ForgotPasswordPage />);
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.'),
      ).toBeInTheDocument();
    });
  });
});
