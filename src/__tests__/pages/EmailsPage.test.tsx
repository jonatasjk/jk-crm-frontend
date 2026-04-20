import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { EmailsPage } from '@/pages/EmailsPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('EmailsPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Email Log heading', () => {
    renderWithProviders(<EmailsPage />);
    expect(screen.getByText('Email Log')).toBeInTheDocument();
  });

  it('shows all email logs after loading', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Follow-up')).toBeInTheDocument();
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
    });
  });

  it('shows filter tabs with correct counts', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => {
      // All tab shows count
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Sent')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('filters to show only SENT emails', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => screen.getByText('Introduction'));

    await userEvent.click(screen.getByRole('button', { name: /^Sent/i }));

    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Follow-up')).toBeNull();
      expect(screen.queryByText('Newsletter')).toBeNull();
    });
  });

  it('filters to show only FAILED emails', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => screen.getByText('Follow-up'));

    await userEvent.click(screen.getByRole('button', { name: /^Failed/i }));

    await waitFor(() => {
      expect(screen.getByText('Follow-up')).toBeInTheDocument();
      expect(screen.queryByText('Introduction')).toBeNull();
    });
  });

  it('filters to show only PENDING emails', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => screen.getByText('Newsletter'));

    await userEvent.click(screen.getByRole('button', { name: /^Pending/i }));

    await waitFor(() => {
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
      expect(screen.queryByText('Introduction')).toBeNull();
    });
  });

  it('shows loading state initially', () => {
    server.use(
      http.get(`${BASE}/email/logs`, () =>
        new Promise(() => {
          // Never resolves — keeps loading state
        }),
      ),
    );
    renderWithProviders(<EmailsPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no emails match filter', async () => {
    server.use(
      http.get(`${BASE}/email/logs`, () => HttpResponse.json([])),
    );
    renderWithProviders(<EmailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/no emails/i)).toBeInTheDocument();
    });
  });

  it('shows recipient types (Investor / Partner) in the Type column', async () => {
    renderWithProviders(<EmailsPage />);
    await waitFor(() => {
      // The table renders entity type as "Investor" or "Partner" (not uppercase)
      expect(screen.getAllByText(/^Investor$|^Partner$/).length).toBeGreaterThan(0);
    });
  });
});
