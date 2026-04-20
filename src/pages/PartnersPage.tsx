import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Upload, LayoutGrid, List } from 'lucide-react';
import { partnersApi } from '@/api/partners.api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { PartnerForm } from '@/components/partners/PartnerForm';
import { CsvImport } from '@/components/shared/CsvImport';
import { PartnerDetail } from '@/components/partners/PartnerDetail';
import { PARTNER_STAGES, PARTNER_STAGE_LABELS } from '@/types/enums';
import type { Partner, ImportResult } from '@/types/models';

const TEMPLATE_HEADERS = ['first_name', 'last_name', 'email', 'phone', 'company', 'website', 'linkedin_url', 'stage', 'notes', 'tags'];

export function PartnersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partners', { search }],
    queryFn: () => partnersApi.list({ search: search || undefined, limit: 200 }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: partnersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Partner> }) =>
      partnersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
    },
  });

  const handleStageChange = async (id: string, stage: string) => {
    await updateMutation.mutateAsync({ id, data: { stage: stage as Partner['stage'] } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              className={`px-3 py-2 ${view === 'kanban' ? 'bg-purple-50 text-purple-600' : 'bg-white text-gray-500'}`}
              onClick={() => setView('kanban')}
              title="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`px-3 py-2 ${view === 'list' ? 'bg-purple-50 text-purple-600' : 'bg-white text-gray-500'}`}
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
            Add partner
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : view === 'kanban' ? (
          <KanbanBoard
            stages={PARTNER_STAGES}
            stageLabels={PARTNER_STAGE_LABELS}
            items={data?.data ?? []}
            onStageChange={handleStageChange}
            onCardClick={(e) => setSelectedPartner(e as Partner)}
            entityType="partner"
          />
        ) : (
          <PartnerListView partners={data?.data ?? []} onSelect={(p) => setSelectedPartner(p)} />
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add partner" size="lg">
        <PartnerForm
          onSubmit={async (d) => { await createMutation.mutateAsync(d); }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import partners from CSV" size="lg">
        <CsvImport
          entityType="partner"
          templateHeaders={TEMPLATE_HEADERS}
          onImport={async (file) => {
            const { data } = await partnersApi.importCsv(file);
            return data as ImportResult;
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
            setShowImport(false);
          }}
        />
      </Modal>

      {selectedPartner && (
        <Modal
          open={!!selectedPartner}
          onClose={() => setSelectedPartner(null)}
          title={`${selectedPartner.firstName} ${selectedPartner.lastName}`}
          size="xl"
        >
          <PartnerDetail
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
            onUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['partners'] });
              queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
              queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
              setSelectedPartner(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function PartnerListView({ partners, onSelect }: { partners: Partner[]; onSelect: (p: Partner) => void }) {
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
          {partners.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 hover:bg-purple-50/50 cursor-pointer" onClick={() => onSelect(p)}>
              <td className="px-4 py-3 font-medium text-gray-900">{p.firstName} {p.lastName}</td>
              <td className="px-4 py-3 text-gray-500">{p.company ?? '—'}</td>
              <td className="px-4 py-3 text-gray-500">{p.email}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                  {PARTNER_STAGE_LABELS[p.stage]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {partners.length === 0 && <div className="py-12 text-center text-gray-400">No partners found</div>}
    </div>
  );
}
