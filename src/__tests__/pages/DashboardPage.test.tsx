import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DashboardPage } from '@/pages/DashboardPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

describe('DashboardPage', () => {
  beforeEach(() => {
    authenticateStore();
  });

  afterEach(() => {
    resetAuthStore();
  });

  it('renders the Dashboard heading', async () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('greets the authenticated user by name', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test admin/i)).toBeInTheDocument();
    });
  });

  it('displays investor count from API', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // mockInvestors has 3 items
      const totalInvestorsBadges = screen.getAllByText('3');
      expect(totalInvestorsBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays partner count from API', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // mockPartners has 2 items
      const totalPartnersBadges = screen.getAllByText('2');
      expect(totalPartnersBadges.length).toBeGreaterThan(0);
    });
  });

  it('displays emails sent today stat', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('renders Investor Pipeline section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Investor Pipeline')).toBeInTheDocument();
    });
  });

  it('renders Partner Pipeline section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Partner Pipeline')).toBeInTheDocument();
    });
  });

  it('shows stat card links to correct routes', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      const investorLink = screen.getByRole('link', { name: /total investors/i });
      expect(investorLink).toHaveAttribute('href', '/investors');
    });
  });
});
