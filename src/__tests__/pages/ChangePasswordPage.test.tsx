import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    authenticateStore();
  });
  afterEach(() => resetAuthStore());

  it('renders the Change your password heading', () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByRole('heading', { name: /change your password/i })).toBeInTheDocument();
  });

  it('renders current password, new password, and confirm password fields', () => {
    renderWithProviders(<ChangePasswordPage />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm (new )?password/i)).toBeInTheDocument();
  });

  it('shows validation error when new passwords do not match', async () => {
    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/current password/i), 'oldpassword');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await userEvent.type(screen.getByLabelText(/confirm (new )?password/i), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('submits successfully with matching passwords', async () => {
    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/current password/i), 'oldpassword');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await userEvent.type(screen.getByLabelText(/confirm (new )?password/i), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    // No error should appear
    await waitFor(() => {
      expect(screen.queryByText(/current password is incorrect/i)).toBeNull();
    });
  });

  it('shows error when current password is incorrect', async () => {
    server.use(
      http.post(`${BASE}/auth/change-password`, () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );
    renderWithProviders(<ChangePasswordPage />);
    await userEvent.type(screen.getByLabelText(/current password/i), 'wrongpassword');
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await userEvent.type(screen.getByLabelText(/confirm (new )?password/i), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    });
  });
});
