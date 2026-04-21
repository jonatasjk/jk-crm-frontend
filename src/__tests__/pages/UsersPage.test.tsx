import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { UsersPage } from '@/pages/UsersPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('UsersPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Users heading', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /users/i })).toBeInTheDocument();
    });
  });

  it('shows "Invite user" button', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite user/i })).toBeInTheDocument();
    });
  });

  it('displays loaded users in the table', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });
  });

  it('opens invite modal when Invite user button is clicked', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByRole('button', { name: /invite user/i }));
    await userEvent.click(screen.getByRole('button', { name: /invite user/i }));
    expect(screen.getByRole('heading', { name: /invite a team member/i })).toBeInTheDocument();
  });

  it('shows success message after successful invite', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByRole('button', { name: /invite user/i }));
    await userEvent.click(screen.getByRole('button', { name: /invite user/i }));

    await userEvent.type(screen.getByLabelText(/email/i), 'newmember@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/invitation sent/i)).toBeInTheDocument();
    });
  });

  it('shows error when invite fails', async () => {
    server.use(
      http.post(`${BASE}/auth/invite`, () =>
        HttpResponse.json({ message: 'Already exists' }, { status: 409 }),
      ),
    );
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByRole('button', { name: /invite user/i }));
    await userEvent.click(screen.getByRole('button', { name: /invite user/i }));

    await userEvent.type(screen.getByLabelText(/email/i), 'existing@test.com');
    await userEvent.click(screen.getByRole('button', { name: /send invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send invitation/i)).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal when trash icon is clicked', async () => {
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText('Test Admin'));

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByRole('heading', { name: /delete user/i })).toBeInTheDocument();
  });

  it('shows error when delete fails', async () => {
    server.use(
      http.delete(`${BASE}/users/:id`, () =>
        HttpResponse.json({ message: 'Cannot delete yourself' }, { status: 400 }),
      ),
    );
    renderWithProviders(<UsersPage />);
    await waitFor(() => screen.getByText('Test Admin'));

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete user/i)).toBeInTheDocument();
    });
  });
});
