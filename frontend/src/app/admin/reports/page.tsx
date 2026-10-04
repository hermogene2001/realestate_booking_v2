'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => { const { data } = await api.get('/admin/reports'); return data; },
    enabled: user?.role === 'ADMIN',
  });

  const pct = (current: number, previous: number) => {
    if (!previous) return null;
    const diff = ((current - previous) / previous) * 100;
    return { value: Math.abs(diff).toFixed(1), up: diff >= 0 };
  };

  const tm = data?.thisMonth;
  const lm = data?.lastMonth;

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Month-over-Month KPIs */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-4">This Month vs Last Month</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
              {[
                { label: 'New Users', current: tm?.users || 0, previous: lm?.users || 0, gradient: 'var(--admin-gradient-blue)' },
                { label: 'Bookings', current: tm?.bookings || 0, previous: lm?.bookings || 0, gradient: 'var(--admin-gradient-violet)' },
                { label: 'Revenue (ETH)', current: Number(tm?.revenue || 0).toFixed(4), previous: Number(lm?.revenue || 0), gradient: 'var(--admin-gradient-emerald)', isEth: true },
                { label: 'New Properties', current: tm?.properties || 0, previous: null, gradient: 'var(--admin-gradient-cyan)' },
              ].map((card, i) => {
                const change = card.previous !== null ? pct(Number(card.current), Number(card.previous)) : null;
                return (
                  <div key={i} className="admin-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                      <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: card.gradient }} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">{card.current}</p>
                    {change && (
                      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={change.up ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
                        </svg>
                        {change.value}% vs last month
                      </div>
                    )}
                    {card.previous !== null && (
                      <p className="text-xs text-slate-400 mt-1">Last month: {card.isEth ? Number(card.previous).toFixed(4) : card.previous}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            {/* Bookings by Status */}
            <div className="admin-card">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Bookings by Status</h2>
              </div>
              <div className="p-6 space-y-3">
                {data?.bookingsByStatus?.map((b: { status: string; count: number }) => {
                  const total = data.bookingsByStatus.reduce((s: number, x: { count: number }) => s + x.count, 0);
                  const pctVal = total > 0 ? ((b.count / total) * 100).toFixed(0) : 0;
                  const colors: Record<string, string> = {
                    COMPLETED: 'bg-emerald-400', PENDING: 'bg-amber-400',
                    LOCKED: 'bg-blue-400', CANCELLED: 'bg-slate-300',
                    DISPUTED: 'bg-rose-400', REFUNDED: 'bg-violet-400',
                  };
                  return (
                    <div key={b.status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{b.status}</span>
                        <span className="text-xs text-slate-500 tabular-nums">{b.count} ({pctVal}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${colors[b.status] || 'bg-slate-400'}`}
                          style={{ width: `${pctVal}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users by Role */}
            <div className="admin-card">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Users by Role</h2>
              </div>
              <div className="p-6 space-y-4">
                {data?.usersByRole?.map((u: { role: string; count: number }) => {
                  const total = data.usersByRole.reduce((s: number, x: { count: number }) => s + x.count, 0);
                  const pctVal = total > 0 ? ((u.count / total) * 100).toFixed(0) : 0;
                  const colors: Record<string, string> = { ADMIN: 'var(--admin-gradient-violet)', OWNER: 'var(--admin-gradient-blue)', TENANT: 'var(--admin-gradient-cyan)' };
                  return (
                    <div key={u.role} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: colors[u.role] || 'var(--admin-gradient-blue)' }}>
                        {u.role.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{u.role}</span>
                          <span className="text-sm font-bold text-slate-900 tabular-nums">{u.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full">
                          <div className="h-1.5 rounded-full" style={{ background: colors[u.role] || 'var(--admin-gradient-blue)', width: `${pctVal}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Districts */}
            <div className="admin-card">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Top Districts by Listings</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {data?.topDistricts?.map((d: { district: string; count: number }, i: number) => (
                  <div key={d.district} className="px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{d.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{d.count}</span>
                      <span className="text-xs text-slate-400">listings</span>
                    </div>
                  </div>
                ))}
                {(!data?.topDistricts || data.topDistricts.length === 0) && (
                  <div className="px-6 py-10 text-center text-sm text-slate-400">No data yet</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
