import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '@/api/partners.api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PartnerForm } from './PartnerForm';
import { EmailCompose } from '@/components/email/EmailCompose';
import type { Partner } from '@/types/models';
import { PARTNER_STAGE_LABELS } from '@/types/enums';
import { formatDateTime, formatDate } from '@/utils';
import { Mail, Pencil, Trash2, ExternalLink, Clock } from 'lucide-react';

interface PartnerDetailProps {
  partner: Partner;
  onClose: () => void;
  onUpdated: () => void;
}

export function PartnerDetail({ partner, onUpdated }: PartnerDetailProps) {
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ['partner', partner.id],
    queryFn: () => partnersApi.get(partner.id).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Partner>) => partnersApi.update(partner.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner', partner.id] });
      queryClient.invalidateQueries({ queryKey: ['entity-list-for-enroll'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
      setShowEdit(false);
      onUpdated();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => partnersApi.delete(partner.id),
    onSuccess: onUpdated,
  });

  const emailLogs = (detail as { emailLogs?: unknown[] } | undefined)?.emailLogs as
    | Array<{ id: string; subject: string; status: string; createdAt: string }>
    | undefined;

  const activities = (detail as { activities?: unknown[] } | undefined)?.activities as
    | Array<{ id: string; type: string; detail: string; createdAt: string }>
    | undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge variant="purple">{PARTNER_STAGE_LABELS[partner.stage]}</Badge>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowEmail(true)} className="gap-1.5">
            <Mail size={13} />
            Send email
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowEdit(true)}>
            <Pencil size={13} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => { if (confirm(`Delete ${partner.firstName} ${partner.lastName}?`)) deleteMutation.mutate(); }}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          { label: 'Email', value: partner.email },
          { label: 'Phone', value: partner.phone },
          { label: 'Company', value: partner.company },
          { label: 'Website', value: partner.website },
        ].map(({ label, value }) =>
          value ? (
            <div key={label}>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
              <p className="text-gray-800 mt-0.5 font-medium truncate">{value}</p>
            </div>
          ) : null,
        )}
        {partner.linkedinUrl && (
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">LinkedIn</p>
            <a href={partner.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline text-sm mt-0.5">
              View profile <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>

      {partner.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {partner.tags.map((tag) => <Badge key={tag} variant="purple">{tag}</Badge>)}
        </div>
      )}

      {partner.notes && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{partner.notes}</p>
        </div>
      )}

      {emailLogs && emailLogs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email History</p>
          <div className="space-y-2">
            {emailLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-sm">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{log.subject}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                </div>
                <Badge variant={log.status === 'SENT' ? 'success' : log.status === 'FAILED' ? 'danger' : 'default'}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities && activities.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Activity</p>
          <div className="space-y-1.5">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-sm">
                <Clock size={12} className="text-gray-300 flex-shrink-0 mt-1" />
                <div>
                  <span className="text-gray-700">{act.detail}</span>
                  <span className="text-gray-400 ml-2 text-xs">{formatDate(act.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit partner" size="lg">
        <PartnerForm initial={partner} onSubmit={async (d) => { await updateMutation.mutateAsync(d); }} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal open={showEmail} onClose={() => setShowEmail(false)} title="Send email" size="lg">
        <EmailCompose
          entityId={partner.id}
          entityType="PARTNER"
          recipientName={`${partner.firstName} ${partner.lastName}`}
          recipientEmail={partner.email}
          onSuccess={() => {
            setShowEmail(false);
            queryClient.invalidateQueries({ queryKey: ['partner', partner.id] });
          }}
          onCancel={() => setShowEmail(false)}
        />
      </Modal>
    </div>
  );
}
