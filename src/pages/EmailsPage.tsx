import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Mail, Paperclip } from 'lucide-react';
import { emailApi } from '@/api/email.api';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils';
import type { EmailStatus } from '@/types/enums';

const STATUS_VARIANT: Record<EmailStatus, 'success' | 'danger' | 'warning'> = {
  SENT: 'success',
  FAILED: 'danger',
  PENDING: 'warning',
};

const STATUS_LABEL: Record<EmailStatus, string> = {
  SENT: 'Sent',
  FAILED: 'Failed',
  PENDING: 'Pending',
};

export function EmailsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EmailStatus | 'ALL'>('ALL');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['email-logs'],
    queryFn: () => emailApi.listAll().then((r) => r.data),
  });

  const filtered = filter === 'ALL' ? logs : logs.filter((l) => l.status === filter);

  const counts = {
    ALL: logs.length,
    SENT: logs.filter((l) => l.status === 'SENT').length,
    FAILED: logs.filter((l) => l.status === 'FAILED').length,
    PENDING: logs.filter((l) => l.status === 'PENDING').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Log</h1>
        <p className="text-sm text-gray-500 mt-1">All outgoing emails across investors and partners</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'SENT', 'FAILED', 'PENDING'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_LABEL[s]}{' '}
            <span className={`ml-1 ${filter === s ? 'text-indigo-200' : 'text-gray-400'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Mail size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No emails{filter !== 'ALL' ? ` with status "${STATUS_LABEL[filter]}"` : ''}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Attachments</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(
                      `/${log.entityType === 'INVESTOR' ? 'investors' : 'partners'}?highlight=${log.entityId}`,
                    )
                  }
                >
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[log.status as EmailStatus]}>
                      {STATUS_LABEL[log.status as EmailStatus] ?? log.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{log.recipientName}</p>
                    <p className="text-xs text-gray-400">{log.recipientEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.entityType === 'INVESTOR' ? 'info' : 'purple'}>
                      {log.entityType === 'INVESTOR' ? 'Investor' : 'Partner'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-gray-700">{log.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.attachments.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <Paperclip size={12} />
                        {log.attachments.length}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {log.sentAt ? formatDateTime(log.sentAt) : formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
