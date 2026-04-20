import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Mail } from 'lucide-react';
import { cn } from '@/utils';
import type { Investor, Partner } from '@/types/models';
import { Badge } from '@/components/ui/Badge';

type Entity = Investor | Partner;

interface KanbanCardProps {
  entity: Entity;
  entityType: 'investor' | 'partner';
  onClick: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ entity, onClick, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer',
        'hover:border-indigo-300 hover:shadow-md transition-all select-none',
        (isDragging || isSortableDragging) && 'opacity-50 ring-2 ring-indigo-400',
      )}
    >
      <p className="text-sm font-semibold text-gray-900 truncate">{entity.firstName} {entity.lastName}</p>

      {entity.company && (
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <Building2 size={11} />
          <span className="truncate">{entity.company}</span>
        </div>
      )}

      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
        <Mail size={11} />
        <span className="truncate">{entity.email}</span>
      </div>

      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entity.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="info" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {entity.tags.length > 3 && (
            <Badge variant="default" className="text-[10px]">
              +{entity.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {entity._count && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
          <span>{entity._count.emailLogs} emails</span>
        </div>
      )}
    </div>
  );
}
