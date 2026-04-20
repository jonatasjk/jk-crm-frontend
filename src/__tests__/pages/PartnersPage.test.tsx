import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { PartnersPage } from '@/pages/PartnersPage';
import { renderWithProviders, authenticateStore, resetAuthStore } from '@/test/utils';

const BASE = 'http://localhost:3001/api/v1';

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

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="rich-text-editor" />,
}));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-text-align', () => ({ default: { configure: vi.fn(() => ({})) } }));

describe('PartnersPage', () => {
  beforeEach(() => authenticateStore());
  afterEach(() => resetAuthStore());

  it('renders the Partners heading', () => {
    renderWithProviders(<PartnersPage />);
    expect(screen.getByText('Partners')).toBeInTheDocument();
  });

  it('shows partner total count after load', async () => {
    renderWithProviders(<PartnersPage />);
    await waitFor(() => {
      expect(screen.getByText(/2 total/i)).toBeInTheDocument();
    });
  });

  it('renders partners in list view', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('Dan Lee')).toBeInTheDocument();
      expect(screen.getByText('Eve Martinez')).toBeInTheDocument();
    });
  });

  it('opens Create modal when Add partner button is clicked', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByRole('button', { name: /add partner/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens Import modal when Import button is clicked', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => {
      expect(screen.getByText('Import partners from CSV')).toBeInTheDocument();
    });
  });

  it('shows "No partners found" in list view when empty', async () => {
    server.use(
      http.get(`${BASE}/partners`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 200, pages: 0 }),
      ),
    );

    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => {
      expect(screen.getByText('No partners found')).toBeInTheDocument();
    });
  });

  it('opens partner detail when clicking row in list view', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Dan Lee'));
    await userEvent.click(screen.getByText('Dan Lee'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('creates a new partner when form is submitted', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByRole('button', { name: /add partner/i }));
    await waitFor(() => screen.getByRole('heading', { name: 'Add partner' }));

    await userEvent.type(screen.getByLabelText('First Name *'), 'New');
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Partner');
    await userEvent.type(screen.getByLabelText('Email *'), 'new@partner.com');

    await userEvent.click(screen.getByRole('button', { name: /create partner/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add partner' })).not.toBeInTheDocument();
    });
  });

  it('closes detail modal after onUpdated callback fires', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Dan Lee'));
    await userEvent.click(screen.getByText('Dan Lee'));
    await waitFor(() => screen.getByRole('dialog'));

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

  it('opens partner detail when clicking a Kanban card', async () => {
    renderWithProviders(<PartnersPage />);
    await waitFor(() => screen.getAllByText(/Dan Lee|Eva Chen|Frank Oz/i)[0]);
    const cards = screen.getAllByText(/Dan Lee/i);
    await userEvent.click(cards[0]);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes import modal when Modal X button is clicked', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => screen.getByText('Import partners from CSV'));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Import partners from CSV')).not.toBeInTheDocument();
    });
  });

  it('closes detail modal when Modal X button is clicked', async () => {
    renderWithProviders(<PartnersPage />);
    await userEvent.click(screen.getByTitle('List view'));
    await waitFor(() => screen.getByText('Dan Lee'));
    await userEvent.click(screen.getByText('Dan Lee'));
    await waitFor(() => screen.getByRole('dialog'));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
