import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { SequencesPage } from '@/pages/SequencesPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

describe('SequencesPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Sequences heading', () => {
    renderWithProviders(<SequencesPage />);
    expect(screen.getByText('Sequences')).toBeInTheDocument();
  });

  it('shows New Sequence button', () => {
    renderWithProviders(<SequencesPage />);
    expect(screen.getByRole('button', { name: /new sequence/i })).toBeInTheDocument();
  });

  it('renders loaded sequences', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => {
      expect(screen.getByText('Investor Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Partner Introduction')).toBeInTheDocument();
    });
  });

  it('shows sequence status badges', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });
  });

  it('shows loading state then sequences', async () => {
    renderWithProviders(<SequencesPage />);
    // Loading state
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).toBeNull();
    });
  });

  it('shows empty state when no sequences exist', async () => {
    server.use(
      http.get(`${BASE}/sequences`, () => HttpResponse.json([])),
    );
    renderWithProviders(<SequencesPage />);
    await waitFor(() => {
      expect(screen.getByText('No sequences yet')).toBeInTheDocument();
    });
  });

  it('opens Create modal when New Sequence is clicked', async () => {
    renderWithProviders(<SequencesPage />);
    await userEvent.click(screen.getByRole('button', { name: /new sequence/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows error when creating sequence without a name', async () => {
    renderWithProviders(<SequencesPage />);
    await userEvent.click(screen.getByRole('button', { name: /new sequence/i }));
    await waitFor(() => screen.getByRole('dialog'));

    // Click "Create & Edit" without filling name
    await userEvent.click(screen.getByRole('button', { name: /create & edit/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('creates a new sequence successfully', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => screen.getByText('Investor Onboarding'));

    await userEvent.click(screen.getByRole('button', { name: /new sequence/i }));
    await waitFor(() => screen.getByRole('dialog'));

    await userEvent.type(screen.getByLabelText(/name/i), 'My New Sequence');
    await userEvent.click(screen.getByRole('button', { name: /create & edit/i }));

    // After successful create, modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('deletes a sequence when delete button is clicked', async () => {
    // window.confirm is invoked by delete button — mock it to return true
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<SequencesPage />);
    await waitFor(() => screen.getByText('Investor Onboarding'));

    // Delete buttons are ghost buttons with only an icon — get all and click first
    const ghostBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('text-red-400'),
    );
    await userEvent.click(ghostBtns[0]);

    await waitFor(() => {
      expect(screen.queryByText('Error')).toBeNull();
    });
    vi.restoreAllMocks();
  });

  it('can pause an active sequence', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => screen.getByText('Investor Onboarding'));

    // The Pause button has text "Pause" (no title attribute)
    const pauseBtn = screen.getByRole('button', { name: /^pause$/i });
    await userEvent.click(pauseBtn);

    await waitFor(() => {
      expect(screen.queryByText('Error')).toBeNull();
    });
  });

  it('closes create modal when Cancel is clicked', async () => {
    renderWithProviders(<SequencesPage />);
    await userEvent.click(screen.getByRole('button', { name: /new sequence/i }));
    await waitFor(() => screen.getByRole('dialog'));

    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('can activate a paused sequence', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => screen.getByText('Paused Sequence'));

    // Activate buttons: one for DRAFT (disabled), one for PAUSED (enabled)
    const activateBtns = screen.getAllByRole('button', { name: /^activate$/i });
    await userEvent.click(activateBtns[activateBtns.length - 1]); // PAUSED has 1 step → enabled

    await waitFor(() => {
      expect(screen.queryByText('Error')).toBeNull();
    });
  });

  it('shows step count for each sequence', async () => {
    renderWithProviders(<SequencesPage />);
    await waitFor(() => {
      // Steps are rendered as "2 steps" / "0 steps" with possible whitespace
      expect(screen.getAllByText(/\d+ steps?/).length).toBeGreaterThan(0);
    });
  });
});
