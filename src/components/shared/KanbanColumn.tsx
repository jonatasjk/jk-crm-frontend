import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { Investor, Partner } from '@/types/models';
import { cn } from '@/utils';

type Entity = Investor | Partner;

interface KanbanColumnProps {
  stage: string;
  label: string;
  items: Entity[];
  onCardClick: (entity: Entity) => void;
  entityType: 'investor' | 'partner';
}

export function KanbanColumn({ stage, label, items, onCardClick, entityType }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  return (
    <div className="flex-shrink-0 w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[calc(100vh-220px)] rounded-xl p-2 space-y-2 transition-colors',
          isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-100/60',
        )}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((entity) => (
            <KanbanCard
              key={entity.id}
              entity={entity}
              entityType={entityType}
              onClick={() => onCardClick(entity)}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="py-8 text-center text-xs text-gray-400">Drop here</div>
        )}
      </div>
    </div>
  );
}
