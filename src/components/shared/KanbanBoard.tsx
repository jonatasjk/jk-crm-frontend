import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { Investor, Partner } from '@/types/models';

type Entity = Investor | Partner;

interface KanbanBoardProps {
  stages: string[];
  stageLabels: Record<string, string>;
  items: Entity[];
  onStageChange: (id: string, newStage: string) => Promise<void>;
  onCardClick: (entity: Entity) => void;
  entityType: 'investor' | 'partner';
}

export function KanbanBoard({
  stages,
  stageLabels,
  items,
  onStageChange,
  onCardClick,
  entityType,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeItem = items.find((i) => i.id === activeId);

  const grouped = stages.reduce<Record<string, Entity[]>>((acc, stage) => {
    acc[stage] = items.filter((i) => i.stage === stage);
    return acc;
  }, {});

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const newStage = over.id as string;
    const item = items.find((i) => i.id === active.id);
    if (!item || item.stage === newStage) return;
    await onStageChange(item.id, newStage);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-0">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={stageLabels[stage] ?? stage}
            items={grouped[stage] ?? []}
            onCardClick={onCardClick}
            entityType={entityType}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <KanbanCard entity={activeItem} entityType={entityType} onClick={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
