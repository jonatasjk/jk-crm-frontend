import { useState } from 'react';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Upload, LayoutGrid, List } from 'lucide-react';
import { investorsApi } from '@/api/investors.api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { InvestorForm } from '@/components/investors/InvestorForm';
import { CsvImport } from '@/components/shared/CsvImport';
import { InvestorDetail } from '@/components/investors/InvestorDetail';
import { INVESTOR_STAGES, INVESTOR_STAGE_LABELS } from '@/types/enums';
import type { Investor } from '@/types/models';
import type { ImportResult } from '@/types/models';

const TEMPLATE_HEADERS = ['first_name', 'last_name', 'email', 'phone', 'company', 'website', 'linkedin_url', 'stage', 'notes', 'tags'];

export function InvestorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  const stageQueries = useQueries({
    queries: INVESTOR_STAGES.map((stage) => ({
      queryKey: ['investors', { search, stage }],
      queryFn: () => investorsApi.list({ search: search || undefined, stage }).then((r) => r.data),
    })),
  });

  const isLoading = stageQueries.some((q) => q.isLoading);
  const allInvestors = stageQueries.flatMap((q) => q.data?.data ?? []);
  const total = stageQueries.reduce((sum, q) => sum + (q.data?.total ?? 0), 0);

  const createMutation = useMutation({
    mutationFn: investorsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Investor> }) =>
      investorsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
    },
  });

  const handleStageChange = async (id: string, stage: string) => {
    await updateMutation.mutateAsync({ id, data: { stage: stage as Investor['stage'] } });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Investors</h1>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-2 ${view === 'kanban' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-500'}`}
              onClick={() => setView('kanban')}
              title="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`px-3 py-2 ${view === 'list' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-500'}`}
              onClick={() => setView('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5">
            <Upload size={14} />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus size={14} />
            Add investor
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            stages={INVESTOR_STAGES}
            stageLabels={INVESTOR_STAGE_LABELS}
            items={allInvestors}
            onStageChange={handleStageChange}
            onCardClick={(e) => setSelectedInvestor(e as Investor)}
            entityType="investor"
          />
        ) : (
          <InvestorListView
            investors={allInvestors}
            onSelect={(e) => setSelectedInvestor(e)}
          />
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add investor" size="lg">
        <InvestorForm
          onSubmit={async (d) => { await createMutation.mutateAsync(d); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import investors from CSV" size="lg">
        <CsvImport
          entityType="investor"
          templateHeaders={TEMPLATE_HEADERS}
          onImport={async (file) => {
            const { data } = await investorsApi.importCsv(file);
            return data as ImportResult;
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['investors'] });
            queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
            setShowImport(false);
          }}
        />
      </Modal>

      {/* Detail/edit modal */}
      {selectedInvestor && (
        <Modal
          open={!!selectedInvestor}
          onClose={() => setSelectedInvestor(null)}
          title={`${selectedInvestor.firstName} ${selectedInvestor.lastName}`}
          size="xl"
        >
          <InvestorDetail
            investor={selectedInvestor}
            onClose={() => setSelectedInvestor(null)}
            onUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['investors'] });
              queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
              queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
              setSelectedInvestor(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function InvestorListView({
  investors,
  onSelect,
}: {
  investors: Investor[];
  onSelect: (i: Investor) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Stage</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((inv) => (
            <tr
              key={inv.id}
              className="border-b border-gray-100 hover:bg-indigo-50/50 cursor-pointer"
              onClick={() => onSelect(inv)}
            >
              <td className="px-4 py-3 font-medium text-gray-900">{inv.firstName} {inv.lastName}</td>
              <td className="px-4 py-3 text-gray-500">{inv.company ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{inv.email}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 font-medium">
                  {INVESTOR_STAGE_LABELS[inv.stage]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {investors.length === 0 && (
        <div className="py-12 text-center text-gray-400">No investors found</div>
      )}
    </div>
  );
}
