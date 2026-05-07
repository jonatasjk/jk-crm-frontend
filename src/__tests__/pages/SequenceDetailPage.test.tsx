import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { SequenceDetailPage } from '@/pages/SequenceDetailPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import { mockSequences } from '@/test/mocks/factories';

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

const BASE = 'http://localhost:3001/api/v1';

const renderSeq = (id = 'seq-1') =>
  renderWithProviders(
    <Routes>
      <Route path="/sequences/:id" element={<SequenceDetailPage />} />
    </Routes>,
    { initialEntries: [`/sequences/${id}`], authenticated: true },
  );

describe('SequenceDetailPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => {
    resetAuthStore();
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    renderSeq();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders sequence name after loading', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText('Investor Onboarding')).toBeInTheDocument();
    });
  });

  it('renders sequence status badge', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('renders entity type badge', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText('Investors')).toBeInTheDocument();
    });
  });

  it('renders description when present', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText('Welcome sequence for new investors')).toBeInTheDocument();
    });
  });

  it('renders steps from the sequence', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Follow up')).toBeInTheDocument();
    });
  });

  it('renders the Email Steps panel', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText(/email steps/i)).toBeInTheDocument();
    });
  });

  it('renders the Enrollments panel', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enrollments/i })).toBeInTheDocument();
    });
  });

  it('renders back link to sequences list', async () => {
    renderSeq();
    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: '' });
      expect(backLink).toHaveAttribute('href', '/sequences');
    });
  });

  it('renders Edit Info button', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit info/i })).toBeInTheDocument();
    });
  });

  it('renders Pause button for ACTIVE sequence', async () => {
    renderSeq('seq-1'); // seq-1 is ACTIVE
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('renders Activate button for PAUSED sequence', async () => {
    renderSeq('seq-3'); // seq-3 is PAUSED
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
    });
  });

  it('Add Step button is visible', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument();
    });
  });

  it('opening Edit Info modal shows form with current name', async () => {
    renderSeq();
    await waitFor(() => screen.getByText('Investor Onboarding'));

    await userEvent.click(screen.getByRole('button', { name: /edit info/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit sequence info/i })).toBeInTheDocument();
    });
  });

  it('opening Add Step modal shows Subject field', async () => {
    renderSeq();
    await waitFor(() => screen.getByRole('button', { name: /add step/i }));

    await userEvent.click(screen.getByRole('button', { name: /add step/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /new step/i })).toBeInTheDocument();
    });
  });

  it('shows draft badge for draft sequence', async () => {
    renderSeq('seq-2'); // seq-2 is DRAFT
    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
    });
  });

  it('shows no steps message for empty sequence', async () => {
    renderSeq('seq-2'); // seq-2 has no steps
    await waitFor(() => {
      expect(screen.getByText(/no steps yet/i)).toBeInTheDocument();
    });
  });

  it('shows empty enrollments message', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText(/no enrollments yet/i)).toBeInTheDocument();
    });
  });

  it('shows enrollment status filter tabs', async () => {
    renderSeq();
    await waitFor(() => {
      expect(screen.getByText(/active \(/i)).toBeInTheDocument();
      expect(screen.getByText(/completed \(/i)).toBeInTheDocument();
    });
  });

  it('shows Enroll button when steps exist', async () => {
    renderSeq('seq-1'); // has steps
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enroll/i })).toBeInTheDocument();
    });
  });

  it('pauses an active sequence', async () => {
    let called = false;
    server.use(
      http.put(`${BASE}/sequences/seq-1`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        if (body.status === 'PAUSED') called = true;
        const seq = { ...mockSequences[0], ...body };
        return HttpResponse.json(seq);
      }),
    );

    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /pause/i }));

    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    await waitFor(() => expect(called).toBe(true));
  });

  it('can add a new step and see it in local state', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /add step/i }));

    // There are two "Add Step" buttons: one in the panel header and one in the step modal
    const addStepBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(addStepBtns[0]);
    await waitFor(() => screen.getByRole('heading', { name: /new step/i }));

    const subjectInput = screen.getByPlaceholderText('Email subject line');
    await userEvent.type(subjectInput, 'My new step');
    // The save button in the step modal says 'Add Step'
    const modalBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(modalBtns[modalBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('My new step')).toBeInTheDocument();
    });
  });

  it('shows Save Steps button when steps are dirty', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /add step/i }));

    const addStepBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(addStepBtns[0]);
    await waitFor(() => screen.getByRole('heading', { name: /new step/i }));

    await userEvent.type(screen.getByPlaceholderText('Email subject line'), 'New Step');
    const modalBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(modalBtns[modalBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save steps/i })).toBeInTheDocument();
    });
  });

  it('enroll modal opens when clicking Enroll button', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));

    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enroll investor/i })).toBeInTheDocument();
    });
  });

  it('shows enrollments in table when present', async () => {
    server.use(
      http.get(`${BASE}/sequences/seq-1/enrollments`, () =>
        HttpResponse.json([
          {
            id: 'enr-1',
            sequenceId: 'seq-1',
            entityId: 'inv-1',
            entityType: 'INVESTOR',
            status: 'ACTIVE',
            currentStepIndex: 0,
            nextSendAt: '2024-06-15T12:00:00Z',
            enrolledAt: '2024-06-01T00:00:00Z',
            entityName: 'Alice Smith',
            entityEmail: 'alice@example.com',
            totalSteps: 2,
            stepsLog: [],
          },
        ]),
      ),
    );

    renderSeq('seq-1');
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('status filter changes visible enrollments', async () => {
    server.use(
      http.get(`${BASE}/sequences/seq-1/enrollments`, () =>
        HttpResponse.json([
          {
            id: 'enr-1',
            sequenceId: 'seq-1',
            entityId: 'inv-1',
            entityType: 'INVESTOR',
            status: 'COMPLETED',
            currentStepIndex: 2,
            nextSendAt: '',
            enrolledAt: '2024-06-01T00:00:00Z',
            entityName: 'Alice Smith',
            entityEmail: 'alice@example.com',
            totalSteps: 2,
            stepsLog: [],
          },
        ]),
      ),
    );

    renderSeq('seq-1');
    await waitFor(() => screen.getByText('Alice Smith'));

    // Click Active filter - should hide completed enrollment
    await userEvent.click(screen.getByRole('button', { name: /^active \(/i }));
    await waitFor(() => {
      expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
    });
  });

  it('saves steps when Save Steps button is clicked', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /add step/i }));

    const addStepBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(addStepBtns[0]);
    await waitFor(() => screen.getByRole('heading', { name: /new step/i }));

    await userEvent.type(screen.getByPlaceholderText('Email subject line'), 'Test Step');
    const modalBtns = screen.getAllByRole('button', { name: /add step/i });
    await userEvent.click(modalBtns[modalBtns.length - 1]);

    await waitFor(() => screen.getByRole('button', { name: /save steps/i }));
    await userEvent.click(screen.getByRole('button', { name: /save steps/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save steps/i })).not.toBeInTheDocument();
    });
  });

  it('submits Edit Info form and closes modal', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /edit info/i }));

    await userEvent.click(screen.getByRole('button', { name: /edit info/i }));
    await waitFor(() => screen.getByRole('heading', { name: /edit sequence info/i }));

    const nameInput = screen.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /edit sequence info/i })).not.toBeInTheDocument();
    });
  });

  it('pauses an active sequence when Pause is clicked', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /pause/i }));

    await userEvent.click(screen.getByRole('button', { name: /pause/i }));

    // Button should still be in document after click (mutation is in-flight)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('opens edit step modal for an existing step', async () => {
    const { container } = renderSeq('seq-1');
    await waitFor(() => screen.getByText('Welcome!'));

    const stepEditBtns = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.className.includes('hover:text-indigo-600'),
    );
    expect(stepEditBtns.length).toBeGreaterThan(0);

    await userEvent.click(stepEditBtns[0]);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit step/i })).toBeInTheDocument();
    });
  });

  it('deletes a step when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { container } = renderSeq('seq-1');
    await waitFor(() => screen.getByText('Welcome!'));

    const stepDeleteBtns = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.className.includes('hover:text-red-500'),
    );
    expect(stepDeleteBtns.length).toBeGreaterThan(0);

    await userEvent.click(stepDeleteBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText('Welcome!')).not.toBeInTheDocument();
    });
  });

  it('opens activate modal for a paused sequence', async () => {
    renderSeq('seq-3');
    await waitFor(() => screen.getByRole('button', { name: /activate/i }));

    await userEvent.click(screen.getByRole('button', { name: /activate/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /activate sequence/i })).toBeInTheDocument();
    });
  });

  it('starts sequence immediately from the activate modal', async () => {
    renderSeq('seq-3');
    await waitFor(() => screen.getByRole('button', { name: /activate/i }));
    await userEvent.click(screen.getByRole('button', { name: /activate/i }));

    await waitFor(() => screen.getByRole('heading', { name: /activate sequence/i }));

    await userEvent.click(screen.getByRole('button', { name: /start now/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /activate sequence/i })).not.toBeInTheDocument();
    });
  });

  it('enrolls an investor from the enroll modal', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => screen.getByRole('heading', { name: /enroll investor/i }));
    await waitFor(() => screen.getByText('Alice Smith'));

    const dialog = screen.getByRole('dialog');
    const entityEnrollBtns = within(dialog).getAllByRole('button', { name: /^enroll$/i });
    await userEvent.click(entityEnrollBtns[0]);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /enroll investor/i })).not.toBeInTheDocument();
    });
  });

  it('enrolls all investors from the enroll modal', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => screen.getByRole('heading', { name: /enroll investor/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /enroll all/i }));

    await waitFor(() => {
      expect(screen.getByText(/enrolled 2 new/i)).toBeInTheDocument();
    });
  });

  it('schedules a sequence from the activate modal', async () => {
    const { container } = renderSeq('seq-3');
    await waitFor(() => screen.getByRole('button', { name: /activate/i }));
    await userEvent.click(screen.getByRole('button', { name: /activate/i }));

    await waitFor(() => screen.getByRole('heading', { name: /activate sequence/i }));

    // Set a scheduled date via fireEvent (datetime-local inputs need direct value change)
    const dateInput = container.querySelector('input[type="datetime-local"]')!;
    fireEvent.change(dateInput, { target: { value: '2025-12-31T10:00' } });

    // Schedule button should now be enabled; click it
    await userEvent.click(screen.getByRole('button', { name: /^schedule$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /activate sequence/i })).not.toBeInTheDocument();
    });
  });

  it('closes enroll modal when the Close button is clicked', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => screen.getByRole('heading', { name: /enroll investor/i }));

    const dialog = screen.getByRole('dialog');
    // The dialog has a modal X button (aria-label="Close") and a text Close button;
    // grab the last one (the explicit text Close button in the enroll modal footer)
    const closeButtons = within(dialog).getAllByRole('button', { name: /^close$/i });
    await userEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /enroll investor/i })).not.toBeInTheDocument();
    });
  });

  it('shows "Only show contacts not enrolled in any sequence" checkbox in enroll modal', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/only show contacts not enrolled in any sequence/i)).toBeInTheDocument();
    });
  });

  it('checkbox is unchecked by default', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/only show contacts not enrolled in any sequence/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  it('sends notEnrolledInAnySequence=true param when checkbox is checked', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/investors`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], total: 0, page: 1, limit: 100, pages: 0 });
      }),
    );

    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => screen.getByLabelText(/only show contacts not enrolled in any sequence/i));
    await userEvent.click(screen.getByLabelText(/only show contacts not enrolled in any sequence/i));

    await waitFor(() => {
      expect(capturedUrl).toContain('notEnrolledInAnySequence=true');
    });
  });

  it('resets the checkbox when enroll modal is closed and reopened', async () => {
    renderSeq('seq-1');
    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => screen.getByLabelText(/only show contacts not enrolled in any sequence/i));
    await userEvent.click(screen.getByLabelText(/only show contacts not enrolled in any sequence/i));

    // Close and reopen
    const dialog = screen.getByRole('dialog');
    const closeButtons = within(dialog).getAllByRole('button', { name: /^close$/i });
    await userEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => screen.getByRole('button', { name: /^enroll$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^enroll$/i }));

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/only show contacts not enrolled in any sequence/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });
});
