import { useQuery } from '@tanstack/react-query';
import { Users, Handshake, Mail, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { investorsApi } from '@/api/investors.api';
import { partnersApi } from '@/api/partners.api';
import { emailApi } from '@/api/email.api';
import { useAuthStore } from '@/store/auth.store';
import { INVESTOR_STAGE_LABELS, PARTNER_STAGE_LABELS } from '@/types/enums';

function StatCard({
  icon: Icon,
  label,
  value,
  to,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  to: string;
  color: string;
}) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: investors } = useQuery({
    queryKey: ['investors', 'dashboard'],
    queryFn: () => investorsApi.list({ limit: 1 }).then((r) => r.data),
  });
  const { data: partners } = useQuery({
    queryKey: ['partners', 'dashboard'],
    queryFn: () => partnersApi.list({ limit: 1 }).then((r) => r.data),
  });

  const { data: investorsFull } = useQuery({
    queryKey: ['investors', 'all-stages'],
    queryFn: () => investorsApi.list({ limit: 100 }).then((r) => r.data),
  });
  const { data: partnersFull } = useQuery({
    queryKey: ['partners', 'all-stages'],
    queryFn: () => partnersApi.list({ limit: 100 }).then((r) => r.data),
  });

  const { data: emailStats } = useQuery({
    queryKey: ['email', 'stats'],
    queryFn: () => emailApi.getStats().then((r) => r.data),
  });

  const investorsByStage = investorsFull?.data.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.stage] = (acc[inv.stage] ?? 0) + 1;
    return acc;
  }, {});

  const partnersByStage = partnersFull?.data.reduce<Record<string, number>>((acc, p) => {
    acc[p.stage] = (acc[p.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Total Investors"
          value={investors?.total ?? '—'}
          to="/investors"
          color="bg-indigo-500"
        />
        <StatCard
          icon={Handshake}
          label="Total Partners"
          value={partners?.total ?? '—'}
          to="/partners"
          color="bg-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Investors"
          value={investorsByStage?.['CLOSED_WON'] ?? 0}
          to="/investors?stage=CLOSED_WON"
          color="bg-green-500"
        />
        <StatCard
          icon={Mail}
          label="Active Partners"
          value={partnersByStage?.['ACTIVE'] ?? 0}
          to="/partners?stage=ACTIVE"
          color="bg-blue-500"
        />
        <StatCard
          icon={Mail}
          label="Emails Sent Today"
          value={emailStats?.sentToday ?? '—'}
          to="/emails"
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Investor Pipeline</h2>
          <div className="space-y-3">
            {Object.entries(INVESTOR_STAGE_LABELS).map(([stage, label]) => {
              const count = investorsByStage?.[stage] ?? 0;
              const total = investorsFull?.total ?? 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Partner Pipeline</h2>
          <div className="space-y-3">
            {Object.entries(PARTNER_STAGE_LABELS).map(([stage, label]) => {
              const count = partnersByStage?.[stage] ?? 0;
              const total = partnersFull?.total ?? 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
