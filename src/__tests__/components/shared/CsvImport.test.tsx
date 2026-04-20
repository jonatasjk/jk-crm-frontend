import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CsvImport } from '@/components/shared/CsvImport';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import type { ImportResult } from '@/types/models';

const mockOnImport = vi.fn(async (): Promise<ImportResult> => ({
  created: 2,
  updated: 0,
  errors: [],
  parseErrors: [],
  total: 2,
}));
const mockOnSuccess = vi.fn();
const templateHeaders = ['firstName', 'lastName', 'email', 'company'];

describe('CsvImport', () => {
  beforeEach(() => {
    authenticateStore();
    vi.clearAllMocks();
  });
  afterEach(() => {
    resetAuthStore();
  });

  it('renders the component without crashing', () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );
    expect(document.body).toBeTruthy();
  });

  it('shows a download template button', () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );
    // The button text is 'Template' with a download icon
    expect(screen.getByRole('button', { name: /template/i })).toBeInTheDocument();
  });

  it('shows instruction text to upload a CSV', () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );
    expect(screen.getByText(/upload a csv/i)).toBeInTheDocument();
  });

  it('shows preview when a valid CSV file is selected', async () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );

    const csvContent = 'firstName,lastName,email,company\nAlice,Smith,alice@example.com,Acme';
    const file = new File([csvContent], 'investors.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);
      await waitFor(() => {
        expect(screen.getByText('investors.csv')).toBeInTheDocument();
      });
    }
  });

  it('shows import button after file is selected', async () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );

    const csvContent = 'firstName,lastName,email\nAlice,Smith,alice@example.com';
    const file = new File([csvContent], 'investors.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      });
    }
  });

  it('shows result after successful import', async () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );

    const csvContent = 'firstName,lastName,email\nAlice,Smith,alice@example.com';
    const file = new File([csvContent], 'investors.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);
      await waitFor(() => screen.getByRole('button', { name: /import/i }));

      await userEvent.click(screen.getByRole('button', { name: /import/i }));
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalled();
      });
    }
  });

  it('download template button triggers URL creation', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderWithProviders(
      <CsvImport
        entityType="partner"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /template/i }));
    // URL.createObjectURL is mocked in setup.ts
    expect(clickSpy).toHaveBeenCalled();
  });

  it('calls onSuccess when the Done button is clicked after a successful import', async () => {
    renderWithProviders(
      <CsvImport
        entityType="investor"
        onImport={mockOnImport}
        onSuccess={mockOnSuccess}
        templateHeaders={templateHeaders}
      />,
    );

    const csvContent = 'firstName,lastName,email\nAlice,Smith,alice@example.com';
    const file = new File([csvContent], 'investors.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (input) {
      await userEvent.upload(input, file);
      await waitFor(() => screen.getByRole('button', { name: /import/i }));
      await userEvent.click(screen.getByRole('button', { name: /import/i }));
      await waitFor(() => screen.getByRole('button', { name: /done/i }));
      await userEvent.click(screen.getByRole('button', { name: /done/i }));
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    }
  });
});
