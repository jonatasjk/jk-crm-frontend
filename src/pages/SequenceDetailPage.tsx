import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  FileEdit,
  UserPlus,
  MessageSquareReply,
  UserMinus,
  Save,
  Calendar,
} from 'lucide-react';
import { sequencesApi, type UpdateSequencePayload } from '@/api/sequences.api';
import { investorsApi } from '@/api/investors.api';
import { partnersApi } from '@/api/partners.api';
import { materialsApi } from '@/api/materials.api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { formatDateTime } from '@/utils';
import type { SequenceStep, Enrollment } from '@/types/models';

const STATUS_VARIANT = {
  DRAFT: 'default',
  ACTIVE: 'success',
  PAUSED: 'warning',
} as const;

const ENROLL_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  REPLIED: 'success',
  UNSUBSCRIBED: 'danger',
};

type EnrollFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'REPLIED' | 'UNSUBSCRIBED';

const EMPTY_STEP: Omit<SequenceStep, 'order'> = {
  subject: '',
  bodyHtml: '',
  delayDays: 1,
  materialId: undefined,
};

export function SequenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // ── local step editing state ──────────────────────────────────────────────
  const [localSteps, setLocalSteps] = useState<SequenceStep[]>([]);
  const [stepsDirty, setStepsDirty] = useState(false);

  // ── step edit modal ────────────────────────────────────────────────────────
  const [stepModal, setStepModal] = useState<{
    open: boolean;
    idx: number | null;
    draft: Omit<SequenceStep, 'order'>;
  }>({ open: false, idx: null, draft: { ...EMPTY_STEP } });

  // ── sequence info edit modal ────────────────────────────────────────────────
  const [infoModal, setInfoModal] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: '', description: '' });
  const [infoError, setInfoError] = useState('');

  // ── enroll modal ───────────────────────────────────────────────────────────
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrollOnlyNew, setEnrollOnlyNew] = useState(false);

  // ── activate modal ─────────────────────────────────────────────────────────
  const toDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [activateModal, setActivateModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // ── enrollment table filter ────────────────────────────────────────────────
  const [enrollFilter, setEnrollFilter] = useState<EnrollFilter>('ALL');
  const [enrollNameFilter, setEnrollNameFilter] = useState('');

  // ── queries ────────────────────────────────────────────────────────────────
  const { data: seq, isLoading } = useQuery({
    queryKey: ['sequence', id],
    queryFn: () => sequencesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['sequence-enrollments', id],
    queryFn: () => sequencesApi.getEnrollments(id!).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', seq?.entityType],
    queryFn: () => materialsApi.list(seq!.entityType).then((r) => r.data),
    enabled: !!seq,
  });

  const { data: entityList } = useQuery<Array<{ id: string; firstName: string; lastName: string; email: string }>>({    queryKey: ['entity-list-for-enroll', seq?.entityType, enrollSearch, enrollOnlyNew],
    queryFn: async () => {
      const params = { limit: 100, ...(enrollSearch ? { search: enrollSearch } : {}), ...(enrollOnlyNew ? { notEnrolledInAnySequence: true } : {}) };
      if (seq?.entityType === 'INVESTOR') {
        return investorsApi.list(params).then((r) => r.data.data);
      }
      return partnersApi.list(params).then((r) => r.data.data);
    },
    enabled: enrollModal && !!seq,
  });

  // Sync local steps when sequence loads
  useEffect(() => {
    if (seq && !stepsDirty) {
      setLocalSteps(seq.steps.slice().sort((a, b) => a.order - b.order));
    }
  }, [seq, stepsDirty]);

  // ── mutations ──────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSequencePayload) => sequencesApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence', id] });
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: (entityId: string) => sequencesApi.enroll(id!, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments', id] });
      queryClient.invalidateQueries({ queryKey: ['sequence', id] });
      setEnrollModal(false);
      setEnrollSearch('');
      setEnrollError('');
    },
    onError: (e: Error) => setEnrollError(e.message),
  });

  const enrollAllMutation = useMutation({
    mutationFn: () => sequencesApi.enrollAll(id!, { notEnrolledInAnySequence: enrollOnlyNew }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments', id] });
      queryClient.invalidateQueries({ queryKey: ['sequence', id] });
      setEnrollError('');
      setEnrollSearch('');
      const { enrolled, skipped } = res.data;
      setEnrollSuccess(`Enrolled ${enrolled} new ${seq?.entityType === 'INVESTOR' ? 'investor' : 'partner'}(s). ${skipped} already enrolled.`);
    },
    onError: (e: Error) => { setEnrollSuccess(''); setEnrollError(e.message); },
  });

  const unenrollMutation = useMutation({
    mutationFn: sequencesApi.unenroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments', id] });
      queryClient.invalidateQueries({ queryKey: ['sequence', id] });
    },
  });

  const repliedMutation = useMutation({
    mutationFn: sequencesApi.markReplied,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sequence-enrollments', id] }),
  });

  // ── step helpers ───────────────────────────────────────────────────────────
  const saveSteps = () => {
    updateMutation.mutate(
      { steps: localSteps.map((s, i) => ({ ...s, order: i + 1 })) },
      {
        onSuccess: () => {
          setStepsDirty(false);
        },
      },
    );
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const next = [...localSteps];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    setLocalSteps(next);
    setStepsDirty(true);
  };

  const deleteStep = (idx: number) => {
    setLocalSteps((prev) => prev.filter((_, i) => i !== idx));
    setStepsDirty(true);
  };

  const openNewStep = () => {
    setStepModal({ open: true, idx: null, draft: { ...EMPTY_STEP } });
  };

  const openEditStep = (idx: number) => {
    const s = localSteps[idx];
    setStepModal({
      open: true,
      idx,
      draft: {
        subject: s.subject,
        bodyHtml: s.bodyHtml,
        delayDays: s.delayDays,
        materialId: s.materialId,
      },
    });
  };

  const saveStep = () => {
    if (!stepModal.draft.subject.trim()) return;
    setLocalSteps((prev) => {
      const steps = [...prev];
      const step = { ...stepModal.draft, order: 0 } as SequenceStep;
      if (stepModal.idx === null) {
        steps.push(step);
      } else {
        steps[stepModal.idx] = step;
      }
      return steps;
    });
    setStepsDirty(true);
    setStepModal({ open: false, idx: null, draft: { ...EMPTY_STEP } });
  };

  // ── info save ──────────────────────────────────────────────────────────────
  const saveInfo = () => {
    if (!infoForm.name.trim()) { setInfoError('Name is required'); return; }
    setInfoError('');
    updateMutation.mutate(
      { name: infoForm.name, description: infoForm.description },
      { onSuccess: () => setInfoModal(false) },
    );
  };

  // ── filtered enrollments ───────────────────────────────────────────────────
  const visibleEnrollments = enrollments
    .filter((e: Enrollment) => enrollFilter === 'ALL' || e.status === enrollFilter)
    .filter((e: Enrollment) => {
      if (!enrollNameFilter.trim()) return true;
      const q = enrollNameFilter.trim().toLowerCase();
      return e.entityName.toLowerCase().includes(q) || e.entityEmail.toLowerCase().includes(q);
    });

  // ── already-enrolled ids ───────────────────────────────────────────────────
  const enrolledIds = new Set(enrollments.map((e: Enrollment) => e.entityId));

  if (isLoading || !seq) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm py-20">Loading…</div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/sequences" className="mt-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={STATUS_VARIANT[seq.status]}>{seq.status}</Badge>
              <Badge variant={seq.entityType === 'INVESTOR' ? 'info' : 'purple'}>
                {seq.entityType === 'INVESTOR' ? 'Investors' : 'Partners'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{seq.name}</h1>
            {seq.description && (
              <p className="text-sm text-gray-500 mt-0.5">{seq.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setInfoForm({ name: seq.name, description: seq.description ?? '' });
              setInfoError('');
              setInfoModal(true);
            }}
            className="gap-1.5"
          >
            <FileEdit size={14} />
            Edit Info
          </Button>
          {seq.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateMutation.mutate({ status: 'PAUSED' })}
              loading={updateMutation.isPending}
              className="gap-1.5"
            >
              <Pause size={14} />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setScheduledDate(toDatetimeLocal(new Date()));
                setActivateModal(true);
              }}
              loading={updateMutation.isPending}
              disabled={localSteps.length === 0}
              className="gap-1.5"
            >
              <Play size={14} />
              Activate
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Steps panel ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Email Steps <span className="text-gray-400 font-normal text-sm">({localSteps.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {stepsDirty && (
                <Button size="sm" onClick={saveSteps} loading={updateMutation.isPending} className="gap-1.5">
                  <Save size={13} />
                  Save Steps
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={openNewStep} className="gap-1">
                <Plus size={14} />
                Add Step
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 min-h-[200px]">
            {localSteps.length === 0 ? (
              <div className="pt-8 text-center text-gray-400 text-sm">
                No steps yet. Add your first email step.
              </div>
            ) : (
              localSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex gap-3"
                >
                  {/* Order */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === localSteps.length - 1}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500">
                        {idx === 0
                          ? step.delayDays === 0
                            ? 'Immediately'
                            : `Day ${step.delayDays}`
                          : `+${step.delayDays}d`}
                      </span>
                      {step.materialId && (
                        <span className="text-xs text-gray-400">📎</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-gray-800 truncate">{step.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2"
                       dangerouslySetInnerHTML={{
                         __html: step.bodyHtml.replace(/<[^>]*>/g, ' ').slice(0, 120),
                       }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => openEditStep(idx)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FileEdit size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this step?')) deleteStep(idx); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Enrollments panel ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Enrollments <span className="text-gray-400 font-normal text-sm">({enrollments.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={enrollNameFilter}
                onChange={(e) => setEnrollNameFilter(e.target.value)}
                placeholder="Filter by name or email"
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-52 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEnrollError(''); setEnrollSuccess(''); setEnrollSearch(''); setEnrollModal(true); }}
                disabled={!seq.steps?.length}
                title={!seq.steps?.length ? 'Add at least one step first' : undefined}
                className="gap-1"
              >
                <UserPlus size={14} />
                Enroll
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto">
            {(['ALL', 'ACTIVE', 'COMPLETED', 'REPLIED', 'UNSUBSCRIBED'] as EnrollFilter[]).map((f) => {
              const count = f === 'ALL' ? enrollments.length : enrollments.filter((e: Enrollment) => e.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setEnrollFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    enrollFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px]">
            {visibleEnrollments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                {enrollFilter === 'ALL' ? 'No enrollments yet' : `No ${enrollFilter.toLowerCase()} enrollments`}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs">
                    <th className="text-left px-4 py-2 font-medium">Contact</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Progress</th>
                    <th className="text-left px-4 py-2 font-medium">Next</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {visibleEnrollments.map((enr: Enrollment) => (
                    <tr key={enr.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-800">{enr.entityName}</p>
                        <p className="text-xs text-gray-400">{enr.entityEmail}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={ENROLL_STATUS_VARIANT[enr.status]}>
                          {enr.status.charAt(0) + enr.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {enr.currentStepIndex + 1} / {enr.totalSteps}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {enr.status === 'ACTIVE' && enr.nextSendAt
                          ? formatDateTime(enr.nextSendAt)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {enr.status === 'ACTIVE' && (
                            <button
                              onClick={() => repliedMutation.mutate(enr.id)}
                              title="Mark as replied"
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            >
                              <MessageSquareReply size={14} />
                            </button>
                          )}
                          {(enr.status === 'ACTIVE' || enr.status === 'COMPLETED') && (
                            <button
                              onClick={() => { if (confirm('Remove this enrollment?')) unenrollMutation.mutate(enr.id); }}
                              title="Unenroll"
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Step Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={stepModal.open}
        onClose={() => setStepModal({ open: false, idx: null, draft: { ...EMPTY_STEP } })}
        title={stepModal.idx === null ? 'New Step' : 'Edit Step'}
        size="lg"
      >
        <div className="p-6 space-y-4">
          <Input
            label="Subject"
            placeholder="Email subject line"
            value={stepModal.draft.subject}
            onChange={(e) => setStepModal((s) => ({ ...s, draft: { ...s.draft, subject: e.target.value } }))}
          />
          <div className="flex flex-col gap-1">
            <RichTextEditor
              label="Body"
              tags={['{{first_name}}', '{{last_name}}', '{{name}}']}
              value={stepModal.draft.bodyHtml}
              onChange={(html) => setStepModal((s) => ({ ...s, draft: { ...s.draft, bodyHtml: html } }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {stepModal.idx === 0 || stepModal.idx === null && localSteps.length === 0
                  ? 'Send after (days from enrollment)'
                  : 'Delay (days after previous step)'}
              </label>
              <input
                type="number"
                min={0}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={stepModal.draft.delayDays}
                onChange={(e) => setStepModal((s) => ({ ...s, draft: { ...s.draft, delayDays: Math.max(0, Number(e.target.value)) } }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Attachment (optional)</label>
              <select
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={stepModal.draft.materialId ?? ''}
                onChange={(e) => setStepModal((s) => ({ ...s, draft: { ...s.draft, materialId: e.target.value || undefined } }))}
              >
                <option value="">— None —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStepModal({ open: false, idx: null, draft: { ...EMPTY_STEP } })}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={saveStep}
              disabled={!stepModal.draft.subject.trim()}
            >
              {stepModal.idx === null ? 'Add Step' : 'Save Step'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Info Edit Modal ─────────────────────────────────────────────────── */}
      <Modal open={infoModal} onClose={() => setInfoModal(false)} title="Edit Sequence Info" size="sm">
        <div className="p-6 space-y-4">
          {infoError && <Alert variant="error">{infoError}</Alert>}
          <Input
            label="Name"
            value={infoForm.name}
            onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={infoForm.description}
              onChange={(e) => setInfoForm({ ...infoForm, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setInfoModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveInfo} loading={updateMutation.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* ── Activate Modal ───────────────────────────────────────────────────── */}
      <Modal open={activateModal} onClose={() => setActivateModal(false)} title="Activate Sequence" size="sm">
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Choose when the sequence should start sending emails to enrolled contacts.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Calendar size={14} />
              Start date &amp; time
            </label>
            <input
              type="datetime-local"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setActivateModal(false);
                updateMutation.mutate({ status: 'ACTIVE' });
              }}
              loading={updateMutation.isPending}
            >
              Start now
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setActivateModal(false);
                updateMutation.mutate({
                  status: 'ACTIVE',
                  scheduledStartAt: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
                });
              }}
              loading={updateMutation.isPending}
              disabled={!scheduledDate}
            >
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Enroll Modal ────────────────────────────────────────────────────── */}
      <Modal open={enrollModal} onClose={() => { setEnrollModal(false); setEnrollSuccess(''); setEnrollError(''); setEnrollOnlyNew(false); }} title={`Enroll ${seq.entityType === 'INVESTOR' ? 'Investor' : 'Partner'}`} size="md">
        <div className="p-6 space-y-4">
          {enrollError && <Alert variant="error">{enrollError}</Alert>}
          {enrollSuccess && <Alert variant="success">{enrollSuccess}</Alert>}
          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={enrollOnlyNew}
              onChange={(e) => setEnrollOnlyNew(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Only show contacts not enrolled in any sequence</span>
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email…"
              value={enrollSearch}
              onChange={(e) => setEnrollSearch(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              loading={enrollAllMutation.isPending}
              onClick={() => enrollAllMutation.mutate()}
            >
              Enroll All
            </Button>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
            {!entityList || entityList.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No results</p>
            ) : (
              entityList.map((entity: { id: string; firstName: string; lastName: string; email: string }) => {
                const alreadyEnrolled = enrolledIds.has(entity.id);
                return (
                  <div key={entity.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{entity.firstName} {entity.lastName}</p>
                      <p className="text-xs text-gray-400">{entity.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyEnrolled ? 'secondary' : 'primary'}
                      disabled={alreadyEnrolled}
                      loading={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(entity.id)}
                    >
                      {alreadyEnrolled ? 'Enrolled' : 'Enroll'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={() => { setEnrollModal(false); setEnrollSuccess(''); setEnrollError(''); setEnrollOnlyNew(false); }}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
