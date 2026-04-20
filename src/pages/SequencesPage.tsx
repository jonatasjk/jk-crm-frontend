import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Handshake, Play, Pause, FileEdit, Trash2, Mail } from 'lucide-react';
import { sequencesApi, type CreateSequencePayload } from '@/api/sequences.api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/utils';
import type { EntityType } from '@/types/enums';

const STATUS_VARIANT = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
} as const;

export function SequencesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateSequencePayload>({
    name: '',
    description: '',
    entityType: 'INVESTOR',
  });
  const [error, setError] = useState('');

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['sequences'],
    queryFn: () => sequencesApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: sequencesApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      setCreateOpen(false);
      navigate(`/sequences/${res.data.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: sequencesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sequences'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' | 'DRAFT' }) =>
      sequencesApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sequences'] }),
  });

  const handleCreate = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setError('');
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sequences</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated email sequences for investors and partners
          </p>
        </div>
        <Button onClick={() => { setForm({ name: '', description: '', entityType: 'INVESTOR' }); setError(''); setCreateOpen(true); }} className="gap-2">
          <Plus size={16} />
          New Sequence
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>
      ) : sequences.length === 0 ? (
        <div className="py-20 text-center">
          <Mail size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No sequences yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first automated email sequence</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={STATUS_VARIANT[seq.status]}>{seq.status}</Badge>
                    <Badge variant={seq.entityType === 'INVESTOR' ? 'info' : 'purple'}>
                      {seq.entityType === 'INVESTOR' ? (
                        <><Users size={10} className="inline mr-1" />Investors</>
                      ) : (
                        <><Handshake size={10} className="inline mr-1" />Partners</>
                      )}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{seq.name}</h3>
                  {seq.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{seq.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''}</span>
                <span>{seq.enrollments?.active ?? 0} active</span>
                <span>{seq.enrollments?.total ?? 0} total</span>
              </div>

              <div className="mt-1 text-xs text-gray-400">Created {formatDate(seq.createdAt)}</div>

              <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                <Button size="sm" variant="outline" onClick={() => navigate(`/sequences/${seq.id}`)} className="flex-1 gap-1.5">
                  <FileEdit size={13} />
                  Edit
                </Button>
                {seq.status === 'ACTIVE' ? (
                  <Button size="sm" variant="secondary" onClick={() => updateMutation.mutate({ id: seq.id, status: 'PAUSED' })} className="gap-1">
                    <Pause size={13} />
                    Pause
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => updateMutation.mutate({ id: seq.id, status: 'ACTIVE' })} className="gap-1" disabled={seq.steps.length === 0}>
                    <Play size={13} />
                    Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => { if (confirm(`Delete "${seq.name}"?`)) deleteMutation.mutate(seq.id); }}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Sequence" size="sm">
        <div className="p-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Input
            label="Name"
            placeholder="e.g. Investor Outreach Q3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Optional description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Target audience</label>
            <div className="flex gap-2">
              {(['INVESTOR', 'PARTNER'] as EntityType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, entityType: t })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.entityType === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {t === 'INVESTOR' ? '👥 Investors' : '🤝 Partners'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreate} loading={createMutation.isPending}>
              Create & Edit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
