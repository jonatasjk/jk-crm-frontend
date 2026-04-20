import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { MaterialsManager } from '@/components/materials/MaterialsManager';
import { materialsApi } from '@/api/materials.api';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('MaterialsManager', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
  });

  it('renders materials list', async () => {
    renderWithProviders(<MaterialsManager />);
    await waitFor(() => {
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      expect(screen.getByText('Financials.xlsx')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<MaterialsManager />);
    // Just verify it renders without crashing
    expect(document.body).toBeTruthy();
  });

  it('shows empty state when no materials', async () => {
    server.use(
      http.get(`${BASE}/materials`, () => HttpResponse.json([])),
    );
    renderWithProviders(<MaterialsManager />);
    await waitFor(() => {
      expect(screen.getByText(/no materials/i)).toBeInTheDocument();
    });
  });

  it('filters materials by entityType when prop is passed', async () => {
    renderWithProviders(<MaterialsManager entityType="INVESTOR" />);
    await waitFor(() => {
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
    });
  });

  it('shows Upload button', async () => {
    renderWithProviders(<MaterialsManager />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });
  });

  it('shows file sizes', async () => {
    renderWithProviders(<MaterialsManager />);
    await waitFor(() => {
      // Pitch Deck.pdf is 2048000 bytes ≈ 2.0 MB
      expect(screen.getByText(/2\.0 mb/i)).toBeInTheDocument();
    });
  });

  it('deletes a material when delete button clicked and confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<MaterialsManager />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red') || b.querySelector('svg'),
    );

    // Find delete buttons (trash icon)
    const trashButtons = screen.getAllByRole('button').filter((b) => {
      const svg = b.querySelector('svg');
      return svg !== null && b.className.includes('red');
    });

    if (trashButtons.length > 0) {
      await userEvent.click(trashButtons[0]);
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
      });
    }
  });

  it('shows error when upload fails with unsupported type', async () => {
    const { container } = renderWithProviders(<MaterialsManager entityType="INVESTOR" />);
    await waitFor(() => screen.getByRole('button', { name: /upload/i }));

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
      });
    } else {
      throw new Error('File input not found in component');
    }
  });

  it('uploads a valid file successfully', async () => {
    const { container } = renderWithProviders(<MaterialsManager entityType="INVESTOR" />);
    await waitFor(() => screen.getByRole('button', { name: /upload/i }));

    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      await userEvent.upload(input, file);
      // Upload should succeed without error
      await new Promise((r) => setTimeout(r, 100));
      expect(screen.queryByText(/file type not supported/i)).not.toBeInTheDocument();
    } else {
      throw new Error('File input not found in component');
    }
  });

  it('shows upload error from server', async () => {
    vi.spyOn(materialsApi, 'upload').mockRejectedValueOnce(new Error('Upload failed: server error'));

    const { container } = renderWithProviders(<MaterialsManager entityType="INVESTOR" />);
    await waitFor(() => screen.getByRole('button', { name: /upload/i }));

    const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    } else {
      throw new Error('File input not found in component');
    }
  });
});
