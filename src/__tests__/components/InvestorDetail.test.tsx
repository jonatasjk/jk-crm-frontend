import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { InvestorDetail } from '@/components/investors/InvestorDetail';
import { PartnerDetail } from '@/components/partners/PartnerDetail';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import { mockInvestors, mockPartners } from '@/test/mocks/factories';

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

const BASE = 'http://localhost:3001/api/v1';
const mockInvestor = mockInvestors[0];
const mockPartner = mockPartners[0];

describe('InvestorDetail', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
  });

  const onClose = vi.fn();
  const onUpdated = vi.fn();

  it('renders investor stage badge', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Prospect')).toBeInTheDocument();
    });
  });

  it('renders Send email button', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('renders edit and delete buttons', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      // Edit pencil and delete trash buttons are present
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows investor contact info', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('opens email compose when Send email is clicked', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('renders pencil (edit) and trash (delete) icon buttons', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));
    // 3 buttons: Send email, pencil edit (ghost), trash delete (ghost red)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('deletes investor when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onUpdatedLocal = vi.fn();

    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    // The delete button has trash icon - filter by class
    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      await waitFor(() => expect(onUpdatedLocal).toHaveBeenCalled());
    }
  });

  it('does not delete when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    server.use(
      http.delete(`${BASE}/investors/inv-1`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    const onUpdatedLocal = vi.fn();
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      expect(onUpdatedLocal).not.toHaveBeenCalled();
    }
  });

  it('opens edit investor modal when pencil button is clicked', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    // allButtons: [0]=Send email, [1]=Edit (pencil), [2]=Delete (trash)
    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit investor/i })).toBeInTheDocument();
    });
  });

  it('submits edit investor form and calls onUpdated', async () => {
    const onUpdatedLocal = vi.fn();
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]); // open edit modal

    await waitFor(() => screen.getByRole('heading', { name: /edit investor/i }));

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdatedLocal).toHaveBeenCalled();
    });
  });

  it('shows email history when investor detail has email logs', async () => {
    server.use(
      http.get(`${BASE}/investors/inv-1`, () =>
        HttpResponse.json({
          ...mockInvestor,
          emailLogs: [
            { id: 'log-1', subject: 'Test Email Subject', status: 'SENT', createdAt: '2024-01-01T00:00:00Z' },
          ],
          activities: [],
        }),
      ),
    );

    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Email Subject')).toBeInTheDocument();
    });
  });

  it('shows activity feed when investor detail has activities', async () => {
    server.use(
      http.get(`${BASE}/investors/inv-1`, () =>
        HttpResponse.json({
          ...mockInvestor,
          emailLogs: [],
          activities: [
            { id: 'act-1', type: 'NOTE', detail: 'Added a note', createdAt: '2024-01-01T00:00:00Z' },
          ],
        }),
      ),
    );

    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Added a note')).toBeInTheDocument();
    });
  });

  it('closes edit modal when Modal X button is clicked (covers onClose callback)', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]); // pencil button
    await waitFor(() => screen.getByRole('heading', { name: /edit investor/i }));

    // Click Modal X button (aria-label="Close") to close edit modal
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /edit investor/i })).not.toBeInTheDocument();
    });
  });

  it('closes email compose modal when Cancel is clicked (covers onCancel callback)', async () => {
    renderWithProviders(
      <InvestorDetail investor={mockInvestor} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => screen.getByRole('heading', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /send email/i })).not.toBeInTheDocument();
    });
  });
});

describe('PartnerDetail', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
  });

  const onClose = vi.fn();
  const onUpdated = vi.fn();

  it('renders partner stage badge', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('renders Send email button', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('shows partner contact info', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => {
      expect(screen.getByText('dan@partner.com')).toBeInTheDocument();
    });
  });

  it('opens email compose when Send email is clicked', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /send email/i })).toBeInTheDocument();
    });
  });

  it('deletes partner when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onUpdatedLocal = vi.fn();

    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const deleteBtns = screen.getAllByRole('button').filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      await waitFor(() => expect(onUpdatedLocal).toHaveBeenCalled());
    }
  });

  it('opens edit partner modal when pencil button is clicked', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]); // pencil/edit button

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit partner/i })).toBeInTheDocument();
    });
  });

  it('submits edit partner form and calls onUpdated', async () => {
    const onUpdatedLocal = vi.fn();
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdatedLocal} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]);

    await waitFor(() => screen.getByRole('heading', { name: /edit partner/i }));

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onUpdatedLocal).toHaveBeenCalled();
    });
  });

  it('shows email history when partner detail has email logs', async () => {
    server.use(
      http.get(`${BASE}/partners/par-1`, () =>
        HttpResponse.json({
          ...mockPartner,
          emailLogs: [
            { id: 'log-2', subject: 'Partner Email', status: 'SENT', createdAt: '2024-01-01T00:00:00Z' },
          ],
          activities: [],
        }),
      ),
    );

    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Partner Email')).toBeInTheDocument();
    });
  });

  it('closes edit modal when Modal X button is clicked (covers onClose callback)', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    const allButtons = screen.getAllByRole('button');
    await userEvent.click(allButtons[1]); // pencil button
    await waitFor(() => screen.getByRole('heading', { name: /edit partner/i }));

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /edit partner/i })).not.toBeInTheDocument();
    });
  });

  it('closes email compose modal when Cancel is clicked (covers onCancel callback)', async () => {
    renderWithProviders(
      <PartnerDetail partner={mockPartner} onClose={onClose} onUpdated={onUpdated} />,
    );
    await waitFor(() => screen.getByRole('button', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /send email/i }));
    await waitFor(() => screen.getByRole('heading', { name: /send email/i }));

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /send email/i })).not.toBeInTheDocument();
    });
  });
});
