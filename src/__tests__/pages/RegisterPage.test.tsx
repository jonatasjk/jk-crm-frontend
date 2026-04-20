import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { RegisterPage } from '@/pages/RegisterPage';
import { renderWithProviders, resetAuthStore } from '@/test/utils';
import { useAuthStore } from '@/store/auth.store';

const BASE = 'http://localhost:3001/api/v1';

describe('RegisterPage', () => {
  beforeEach(() => resetAuthStore());
  afterEach(() => resetAuthStore());

  it('renders the Create account heading', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders name, email, and password fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders Create account submit button', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('has a link to sign in page', () => {
    renderWithProviders(<RegisterPage />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('registers successfully and navigates to dashboard', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Full Name'), 'New User');
    await userEvent.type(screen.getByLabelText('Email'), 'newuser@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  it('shows error when email is already registered', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    );
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Full Name'), 'Duplicate User');
    await userEvent.type(screen.getByLabelText('Email'), 'existing@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('shows generic error on server failure', async () => {
    server.use(
      http.post(`${BASE}/auth/register`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    );
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByLabelText('Full Name'), 'Test User');
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/request failed/i)).toBeInTheDocument();
    });
  });
});
