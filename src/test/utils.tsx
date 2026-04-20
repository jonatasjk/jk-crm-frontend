import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { mockUser } from './mocks/factories';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderOptions2 extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
  authenticated?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions2 = {},
) {
  const {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    authenticated = false,
    ...rest
  } = options;

  if (authenticated) {
    useAuthStore.setState({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient };
}

/** Authenticate the store directly without rendering login page */
export function authenticateStore() {
  useAuthStore.setState({
    user: mockUser,
    token: 'test-token',
    isAuthenticated: true,
  });
}

/** Reset auth store to unauthenticated state */
export function resetAuthStore() {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
}
