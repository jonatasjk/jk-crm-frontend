import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Capture DnD drag callbacks so tests can simulate drag events
const dndCallbacks = vi.hoisted(() => ({
  onDragStart: undefined as ((e: any) => void) | undefined,
  onDragEnd: undefined as ((e: any) => void) | undefined,
}));

// Mock DnD Kit before importing components that depend on it
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd }: any) => {
    dndCallbacks.onDragStart = onDragStart;
    dndCallbacks.onDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
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

import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { INVESTOR_STAGES, INVESTOR_STAGE_LABELS } from '@/types/enums';
import type { Investor } from '@/types/models';

const makeInvestor = (overrides: Partial<Investor>): Investor => ({
  id: 'inv-1',
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@test.com',
  stage: 'PROSPECT',
  tags: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('KanbanBoard', () => {
  const onStageChange = vi.fn().mockResolvedValue(undefined);
  const onCardClick = vi.fn();

  it('renders a column for each stage', () => {
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={[]}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );
    expect(screen.getByText('Prospect')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
    expect(screen.getByText('Term Sheet')).toBeInTheDocument();
    expect(screen.getByText('Closed / Won')).toBeInTheDocument();
    expect(screen.getByText('Closed / Lost')).toBeInTheDocument();
  });

  it('renders card in the correct column', () => {
    const items = [
      makeInvestor({ id: 'inv-1', firstName: 'Alice', lastName: 'Smith', stage: 'CONTACTED' }),
    ];
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={items}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('calls onCardClick when a card is clicked', async () => {
    const items = [makeInvestor({ id: 'inv-click', firstName: 'Bob', lastName: 'Jones' })];
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={items}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );

    await userEvent.click(screen.getByText('Bob Jones'));
    expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'inv-click' }));
  });

  it('shows company when present', () => {
    const items = [makeInvestor({ id: 'inv-c', company: 'Acme Corp' })];
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={items}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows email on card', () => {
    const items = [makeInvestor({ id: 'inv-e', email: 'test@acme.com' })];
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={items}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );
    expect(screen.getByText('test@acme.com')).toBeInTheDocument();
  });

  it('shows "Drop here" placeholder in empty columns', () => {
    render(
      <KanbanBoard
        stages={['PROSPECT']}
        stageLabels={{ PROSPECT: 'Prospect' }}
        items={[]}
        onStageChange={onStageChange}
        onCardClick={onCardClick}
        entityType="investor"
      />,
    );
    expect(screen.getByText('Drop here')).toBeInTheDocument();
  });

  it('calls onStageChange when item is dragged to a new stage', async () => {
    const stageFn = vi.fn().mockResolvedValue(undefined);
    const investor = makeInvestor({ id: 'inv-drag', stage: 'PROSPECT' });
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={[investor]}
        onStageChange={stageFn}
        onCardClick={vi.fn()}
        entityType="investor"
      />,
    );

    // Simulate drag start then drop on a different stage column
    dndCallbacks.onDragStart?.({ active: { id: 'inv-drag' } });
    dndCallbacks.onDragEnd?.({ active: { id: 'inv-drag' }, over: { id: 'DUE_DILIGENCE' } });

    await waitFor(() => {
      expect(stageFn).toHaveBeenCalledWith('inv-drag', 'DUE_DILIGENCE');
    });
  });

  it('does not call onStageChange when item is dropped on the same stage', () => {
    const stageFn = vi.fn();
    const investor = makeInvestor({ id: 'inv-same', stage: 'PROSPECT' });
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={[investor]}
        onStageChange={stageFn}
        onCardClick={vi.fn()}
        entityType="investor"
      />,
    );

    dndCallbacks.onDragStart?.({ active: { id: 'inv-same' } });
    dndCallbacks.onDragEnd?.({ active: { id: 'inv-same' }, over: { id: 'PROSPECT' } });

    expect(stageFn).not.toHaveBeenCalled();
  });

  it('does not call onStageChange when drag ends with no drop target', () => {
    const stageFn = vi.fn();
    const investor = makeInvestor({ id: 'inv-no-target', stage: 'PROSPECT' });
    render(
      <KanbanBoard
        stages={INVESTOR_STAGES}
        stageLabels={INVESTOR_STAGE_LABELS}
        items={[investor]}
        onStageChange={stageFn}
        onCardClick={vi.fn()}
        entityType="investor"
      />,
    );

    dndCallbacks.onDragEnd?.({ active: { id: 'inv-no-target' }, over: null });

    expect(stageFn).not.toHaveBeenCalled();
  });
});
