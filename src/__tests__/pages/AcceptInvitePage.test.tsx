import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { renderWithProviders, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('AcceptInvitePage', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('shows loading state initially when token is present', () => {
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite?token=test-token'],
    });
    expect(screen.getByText(/validating invitation/i)).toBeInTheDocument();
  });

  it('shows error when no token in URL', async () => {
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite'],
    });
    await waitFor(() => {
      expect(screen.getByText(/no invitation token found/i)).toBeInTheDocument();
    });
  });

  it('shows error when token is invalid', async () => {
    server.use(
      http.get(`${BASE}/auth/verify-invite`, () =>
        HttpResponse.json({ message: 'Invalid' }, { status: 400 }),
      ),
    );
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite?token=bad-token'],
    });
    await waitFor(() => {
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });
  });

  it('renders form after successful token verification', async () => {
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite?token=valid-token'],
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite?token=valid-token'],
    });
    await waitFor(() => screen.getByLabelText(/full name/i));

    await userEvent.type(screen.getByLabelText(/full name/i), 'New User');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('shows error when accept invite fails', async () => {
    server.use(
      http.post(`${BASE}/auth/accept-invite`, () =>
        HttpResponse.json({ message: 'Already used' }, { status: 400 }),
      ),
    );
    renderWithProviders(<AcceptInvitePage />, {
      initialEntries: ['/accept-invite?token=valid-token'],
    });
    await waitFor(() => screen.getByLabelText(/full name/i));

    await userEvent.type(screen.getByLabelText(/full name/i), 'New User');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
    });
  });
});
