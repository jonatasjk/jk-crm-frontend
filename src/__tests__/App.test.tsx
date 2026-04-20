import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';
import { useAuthStore } from '@/store/auth.store';
import { mockUser } from '@/test/mocks/factories';

// BrowserRouter reads window.location (a static mock) but navigates via window.history.replaceState,
// causing an infinite redirect loop in tests. Replace it with MemoryRouter so navigation works.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter>{children}</actual.MemoryRouter>
    ),
  };
});

describe('App', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('redirects unauthenticated user to the login page', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    });
  });

  it('shows application layout when user is authenticated', async () => {
    useAuthStore.setState({ user: mockUser, token: 'test-token', isAuthenticated: true });
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
  });
});
