import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { AppLayout } from '@/components/layout/AppLayout';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('AppLayout', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders all navigation items', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    // Both sidebars render so use getAllBy
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Investors').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Partners').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Materials').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Emails').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sequences').length).toBeGreaterThan(0);
  });

  it('renders the app brand name', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    expect(screen.getAllByText('JK CRM').length).toBeGreaterThan(0);
  });

  it('renders user name and email', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    expect(screen.getAllByText('Test Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('admin@test.com').length).toBeGreaterThan(0);
  });

  it('renders children content', () => {
    renderWithProviders(<AppLayout><div>hello world</div></AppLayout>);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('shows Sign out button', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    expect(screen.getAllByText('Sign out').length).toBeGreaterThan(0);
  });

  it('shows Change password button', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    expect(screen.getAllByText('Change password').length).toBeGreaterThan(0);
  });

  it('logout clears auth state', async () => {
    const { useAuthStore } = await import('@/store/auth.store');
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Sign out');
    await userEvent.click(buttons[0]);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('opens change password modal on button click', async () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
  });

  it('change password form has three password fields', async () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('shows success message on successful password change', async () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);

    await userEvent.type(screen.getByLabelText('Current Password'), 'current123');
    await userEvent.type(screen.getByLabelText('New Password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
    });
  });

  it('shows error when current password is wrong', async () => {
    server.use(
      http.post(`${BASE}/auth/change-password`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);

    await userEvent.type(screen.getByLabelText('Current Password'), 'wrongpass');
    await userEvent.type(screen.getByLabelText('New Password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument();
    });
  });

  it('shows validation error when new passwords do not match', async () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);

    await userEvent.type(screen.getByLabelText('Current Password'), 'current123');
    await userEvent.type(screen.getByLabelText('New Password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('mobile sidebar buttons for nav items are present', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    // Both desktop and mobile sidebars render nav links
    expect(screen.getAllByRole('link', { name: /investors/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('nav links point to correct routes', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');
    const investorLinks = screen.getAllByRole('link', { name: /^investors$/i });
    expect(investorLinks[0]).toHaveAttribute('href', '/investors');
  });

  it('closes change password modal on cancel', async () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    const buttons = screen.getAllByText('Change password');
    await userEvent.click(buttons[0]);
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /change password/i })).not.toBeInTheDocument();
    });
  });

  it('user initial is shown in avatar', () => {
    renderWithProviders(<AppLayout><div>content</div></AppLayout>);
    // User name is "Test Admin" so initial is "T"
    expect(screen.getAllByText('T').length).toBeGreaterThan(0);
  });
});
