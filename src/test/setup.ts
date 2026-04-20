import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Silence React act() warnings in tests
// eslint-disable-next-line no-console
const originalError = console.error;
beforeAll(() => {
  // Start the MSW mock server
  server.listen({ onUnhandledRequest: 'warn' });

  // Mock window.location to prevent jsdom navigation errors
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost',
      href: 'http://localhost/',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });

  // Mock ResizeObserver (required by Tiptap and some UI libs)
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock URL.createObjectURL
  globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  globalThis.URL.revokeObjectURL = vi.fn();

  // Suppress known noisy console.error messages in tests
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Warning: An update to') ||
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('Not implemented: navigation')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers();
  // Clear localStorage to prevent state leakage
  localStorage.clear();
});

afterAll(() => {
  server.close();
  console.error = originalError;
});
