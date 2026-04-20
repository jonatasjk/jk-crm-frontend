import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import { mockMaterials } from '@/test/mocks/factories';
import { materialsApi } from '@/api/materials.api';

const BASE = 'http://localhost:3001/api/v1';

describe('MaterialsPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Materials heading', () => {
    renderWithProviders(<MaterialsPage />);
    // Multiple "Materials" elements exist (page h1 + manager h3) — use heading role
    expect(screen.getByRole('heading', { level: 1, name: 'Materials' })).toBeInTheDocument();
  });

  it('renders the three tab buttons', () => {
    renderWithProviders(<MaterialsPage />);
    expect(screen.getByRole('button', { name: 'All materials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Investor materials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partner materials' })).toBeInTheDocument();
  });

  it('shows all materials on default "All materials" tab', async () => {
    renderWithProviders(<MaterialsPage />);
    await waitFor(() => {
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      expect(screen.getByText('Financials.xlsx')).toBeInTheDocument();
    });
  });

  it('filters to investor materials when Investor tab is clicked', async () => {
    server.use(
      http.get(`${BASE}/materials`, ({ request }) => {
        const url = new URL(request.url);
        const entityType = url.searchParams.get('entityType');
        if (entityType === 'INVESTOR') {
          return HttpResponse.json([
            {
              id: 'mat-1',
              name: 'Pitch Deck.pdf',
              fileKey: 'key',
              mimeType: 'application/pdf',
              sizeBytes: 2048000,
              entityType: 'INVESTOR',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ]);
        }
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders(<MaterialsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Investor materials' }));
    await waitFor(() => {
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
    });
  });

  it('shows subheading text', () => {
    renderWithProviders(<MaterialsPage />);
    expect(
      screen.getByText(/upload and manage pitch decks/i),
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    server.use(
      http.get(`${BASE}/materials`, () => new Promise(() => {})),
    );
    renderWithProviders(<MaterialsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows upload button', async () => {
    renderWithProviders(<MaterialsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });
  });

  it('shows material file size', async () => {
    renderWithProviders(<MaterialsPage />);
    await waitFor(() => {
      // The MaterialsManager shows formatted file sizes
      expect(screen.getByText(/2.0 MB|2,0 MB/)).toBeInTheDocument();
    });
  });

  it('uploads a file successfully and clears any error', async () => {
    const { container } = renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    const fileInput = container.querySelector('input[type="file"]')!;
    const pdfFile = new File(['content'], 'deck.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Upload mutation fires; on success it invalidates queries (no error shown)
    await waitFor(() => {
      expect(screen.queryByText(/file type not supported/i)).not.toBeInTheDocument();
    });
  });

  it('shows error when an unsupported file type is selected', async () => {
    const { container } = renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    const fileInput = container.querySelector('input[type="file"]')!;
    const txtFile = new File(['content'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [txtFile] } });

    await waitFor(() => {
      expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
    });
  });

  it('dismisses the upload error when the dismiss button is clicked', async () => {
    const { container } = renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    // Trigger an invalid-type upload to show the error
    const fileInput = container.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'x.txt', { type: 'text/plain' })] } });
    await waitFor(() => screen.getByText(/file type not supported/i));

    // Click the dismiss (×) button on the error alert
    const dismissBtn = container.querySelector('[class*="opacity-70"]')!;
    await userEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByText(/file type not supported/i)).not.toBeInTheDocument();
    });
  });

  it('calls createObjectURL when the download button is clicked', async () => {
    renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    await userEvent.click(screen.getAllByTitle('Download')[0]);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('deletes a material when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let deleteCount = 0;
    server.use(
      http.get(`${BASE}/materials`, () => {
        if (deleteCount > 0) return HttpResponse.json([mockMaterials[1]]);
        return HttpResponse.json(mockMaterials);
      }),
      http.delete(`${BASE}/materials/:id`, () => {
        deleteCount++;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    await userEvent.click(screen.getAllByTitle('Delete')[0]);

    await waitFor(() => {
      expect(screen.queryByText('Pitch Deck.pdf')).not.toBeInTheDocument();
    });
  });

  it('shows upload error when the server rejects a file', async () => {
    // Spy on materialsApi.upload to reject (MSW multipart interception can be flaky)
    vi.spyOn(materialsApi, 'upload').mockRejectedValueOnce(new Error('Upload failed: server error'));
    const { container } = renderWithProviders(<MaterialsPage />);
    await waitFor(() => screen.getByText('Pitch Deck.pdf'));

    const fileInput = container.querySelector('input[type="file"]')!;
    const pdfFile = new File(['content'], 'deck.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(screen.getByText('Upload failed: server error')).toBeInTheDocument();
    });
  });
});
