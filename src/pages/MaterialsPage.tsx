import { MaterialsManager } from '@/components/materials/MaterialsManager';
import { useState } from 'react';
import type { EntityType } from '@/types/enums';

export function MaterialsPage() {
  const [tab, setTab] = useState<EntityType | 'ALL'>('ALL');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
        <p className="text-sm text-gray-500 mt-1">Upload and manage pitch decks, one-pagers, and partner materials</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['ALL', 'INVESTOR', 'PARTNER'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'ALL' ? 'All materials' : t === 'INVESTOR' ? 'Investor materials' : 'Partner materials'}
          </button>
        ))}
      </div>

      <MaterialsManager entityType={tab === 'ALL' ? undefined : tab} />
    </div>
  );
}
