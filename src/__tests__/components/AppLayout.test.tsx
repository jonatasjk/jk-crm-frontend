import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/auth.store';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

function renderLayout() {
  return renderWithProviders(
    <AppLayout><div>Test Page</div></AppLayout>,
    { initialEntries: ['/dashboard'] },
  );
}

describe('AppLayout', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders navigation links and page content', () => {
    renderLayout();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Investors').length).toBeGreaterThan(0);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('opens mobile sidebar overlay when hamburger button is clicked', async () => {
    const { container } = renderLayout();
    const hamburger = container.querySelector('header button')!;
    // Overlay is not shown initially
    expect(container.querySelector('[class*="z-40"]')).toBeNull();

    await userEvent.click(hamburger);

    // Overlay should appear when sidebar is open
    expect(container.querySelector('[class*="z-40"]')).toBeInTheDocument();
  });

  it('closes mobile sidebar when overlay is clicked', async () => {
    const { container } = renderLayout();
    // Open sidebar
    await userEvent.click(container.querySelector('header button')!);
    expect(container.querySelector('[class*="z-40"]')).toBeInTheDocument();

    // Click the overlay
    await userEvent.click(container.querySelector('[class*="z-40"]')!);

    await waitFor(() => {
      expect(container.querySelector('[class*="z-40"]')).toBeNull();
    });
  });

  it('closes mobile sidebar when X button is clicked', async () => {
    const { container } = renderLayout();
    // Open sidebar
    await userEvent.click(container.querySelector('header button')!);
    expect(container.querySelector('[class*="z-40"]')).toBeInTheDocument();

    // Click the X button inside the mobile sidebar
    const xButton = container.querySelector('button[class*="ml-auto"]')!;
    await userEvent.click(xButton);

    await waitFor(() => {
      expect(container.querySelector('[class*="z-40"]')).toBeNull();
    });
  });

  it('closes mobile sidebar when a nav link is clicked', async () => {
    const { container } = renderLayout();
    // Open sidebar
    await userEvent.click(container.querySelector('header button')!);
    expect(container.querySelector('[class*="z-40"]')).toBeInTheDocument();

    // Click a nav link
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    await userEvent.click(dashboardLinks[0]);

    await waitFor(() => {
      expect(container.querySelector('[class*="z-40"]')).toBeNull();
    });
  });

  it('opens the Change Password modal when its button is clicked', async () => {
    renderLayout();
    const changePwdBtns = screen.getAllByRole('button', { name: /change password/i });
    await userEvent.click(changePwdBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
    });
  });

  it('shows success message after changing password', async () => {
    renderLayout();
    await userEvent.click(screen.getAllByRole('button', { name: /change password/i })[0]);
    await waitFor(() => screen.getByLabelText('Current Password'));

    await userEvent.type(screen.getByLabelText('Current Password'), 'OldPass1!');
    await userEvent.type(screen.getByLabelText('New Password'), 'NewPass1!');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error when current password is incorrect', async () => {
    server.use(
      http.post(`${BASE}/auth/change-password`, () => new HttpResponse(null, { status: 401 })),
    );
    renderLayout();
    await userEvent.click(screen.getAllByRole('button', { name: /change password/i })[0]);
    await waitFor(() => screen.getByLabelText('Current Password'));

    await userEvent.type(screen.getByLabelText('Current Password'), 'WrongPass!');
    await userEvent.type(screen.getByLabelText('New Password'), 'NewPass1!');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    });
  });

  it('logs out and clears auth state when Sign out is clicked', async () => {
    renderLayout();
    const signOutBtns = screen.getAllByRole('button', { name: /sign out/i });
    await userEvent.click(signOutBtns[0]);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
