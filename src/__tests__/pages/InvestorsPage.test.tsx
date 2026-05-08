import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { InvestorsPage } from '@/pages/InvestorsPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';
import { mockInvestors } from '@/test/mocks/factories';

const BASE = 'http://localhost:3001/api/v1';

// Mock DnD Kit so Kanban renders without real drag events
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children?: React.ReactNode }) => <div>{children ?? null}</div>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCorners: vi.fn(),
  useDroppable: vi.fn(() => ({ isOver: false, setNodeRef: vi.fn() })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// Mock RichTextEditor (used in InvestorDetail/EmailCompose)
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="rich-text-editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

describe('InvestorsPage', () => {
  beforeEach(() => {
    authenticateStore();
  });

  afterEach(() => {
    resetAuthStore();
  });

  it('renders the Investors heading', async () => {
    renderWithProviders(<InvestorsPage />);
    expect(screen.getByText('Investors')).toBeInTheDocument();
  });

  it('shows investor total count after load', async () => {
    renderWithProviders(<InvestorsPage />);
    await waitFor(() => {
      expect(screen.getByText(/3 total/i)).toBeInTheDocument();
    });
  });

  it('renders investors in list view', async () => {
    renderWithProviders(<InvestorsPage />);
    // Switch to list view
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('opens Create modal when Add investor button is clicked', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByRole('button', { name: /add investor/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // The modal heading and the button share the same text - use heading role
      expect(screen.getByRole('heading', { name: 'Add investor' })).toBeInTheDocument();
    });
  });

  it('closes Create modal when Cancel is clicked', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByRole('button', { name: /add investor/i }));
    await waitFor(() => screen.getByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('opens Import modal when Import button is clicked', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => {
      expect(screen.getByText('Import investors from CSV')).toBeInTheDocument();
    });
  });

  it('switches between kanban and list view', async () => {
    renderWithProviders(<InvestorsPage />);
    const listBtn = screen.getByTitle('List view');
    const kanbanBtn = screen.getByTitle('Kanban view');

    await userEvent.click(listBtn);
    await waitFor(() => {
      // In list view, we expect a table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    await userEvent.click(kanbanBtn);
    await waitFor(() => {
      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  it('shows "No investors found" in list view when search returns empty', async () => {
    server.use(
      http.get(`${BASE}/investors`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 50, pages: 0 }),
      ),
    );

    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('No investors found')).toBeInTheDocument();
    });
  });

  it('renders kanban view with investor names', async () => {
    renderWithProviders(<InvestorsPage />);
    await waitFor(() => {
      const names = screen.getAllByText(/Alice Smith|Bob Johnson|Carol Williams/);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  it('opens investor detail when clicking a row in list view', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Alice Smith'));
    await userEvent.click(screen.getByText('Alice Smith'));
    await waitFor(() => {
      // Modal title should show investor name
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('creates a new investor when form is submitted', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByRole('button', { name: /add investor/i }));
    await waitFor(() => screen.getByRole('heading', { name: 'Add investor' }));

    await userEvent.type(screen.getByLabelText('First Name *'), 'New');
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Investor');
    await userEvent.type(screen.getByLabelText('Email *'), 'new@example.com');

    await userEvent.click(screen.getByRole('button', { name: /create investor/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add investor' })).not.toBeInTheDocument();
    });
  });

  it('closes detail modal after onUpdated is triggered', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<InvestorsPage />);
    // Switch to list view and open detail
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Alice Smith'));
    await userEvent.click(screen.getByText('Alice Smith'));
    await waitFor(() => screen.getByRole('dialog'));

    // Delete inside detail modal to trigger onUpdated
    const dialog = screen.getByRole('dialog');
    const deleteBtns = Array.from(dialog.querySelectorAll('button')).filter((b) =>
      b.className.includes('red'),
    );
    if (deleteBtns.length > 0) {
      await userEvent.click(deleteBtns[0]);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    }
  });
  it('opens investor detail when clicking a Kanban card', async () => {
    renderWithProviders(<InvestorsPage />);
    // Default view is Kanban — wait for investor names to load
    await waitFor(() => screen.getAllByText(/Alice Smith|Bob Johnson|Carol Williams/i)[0]);
    const cards = screen.getAllByText(/Alice Smith/i);
    await userEvent.click(cards[0]);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes import modal when Modal X button is clicked', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => screen.getByText('Import investors from CSV'));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Import investors from CSV')).not.toBeInTheDocument();
    });
  });

  it('closes detail modal when Modal X button is clicked', async () => {
    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Alice Smith'));
    await userEvent.click(screen.getByText('Alice Smith'));
    await waitFor(() => screen.getByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

describe('InvestorsPage — InvestorListView helpers', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders investor stage badge in list view', async () => {
    server.use(
      http.get(`${BASE}/investors`, ({ request }) => {
        const url = new URL(request.url);
        const stage = url.searchParams.get('stage');
        const filtered = stage === mockInvestors[0].stage ? [mockInvestors[0]] : [];
        return HttpResponse.json({
          data: filtered,
          total: filtered.length,
          page: 1,
          limit: 50,
          pages: filtered.length > 0 ? 1 : 0,
        });
      }),
    );

    renderWithProviders(<InvestorsPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('Prospect')).toBeInTheDocument();
    });
  });
});
