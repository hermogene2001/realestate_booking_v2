'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface KPICard {
  label: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  gradient: string;
  icon: React.ReactNode;
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/stats'); return data; },
    enabled: user?.role === 'ADMIN',
  });

  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: async () => { const { data } = await api.get('/admin/properties/pending'); return data.properties; },
    enabled: user?.role === 'ADMIN',
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => { const { data } = await api.get('/admin/users?limit=5'); return data.users; },
    enabled: user?.role === 'ADMIN',
  });

  const { data: alertsData } = useQuery({
    queryKey: ['admin-fraud-alerts'],
    queryFn: async () => { const { data } = await api.get('/admin/fraud-alerts'); return data.alerts; },
    enabled: user?.role === 'ADMIN',
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin-recent-bookings'],
    queryFn: async () => { const { data } = await api.get('/admin/bookings?limit=5'); return data; },
    enabled: user?.role === 'ADMIN',
  });

  const kpiCards: KPICard[] = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      gradient: 'var(--admin-gradient-blue)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    },
    {
      label: 'Properties',
      value: stats?.totalProperties || 0,
      gradient: 'var(--admin-gradient-emerald)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18M5.25 3h13.5M5.25 7.5h13.5M5.25 12h13.5M5.25 16.5h13.5" /></svg>,
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings || 0,
      gradient: 'var(--admin-gradient-violet)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    },
    {
      label: 'Active Disputes',
      value: stats?.activeDisputes || 0,
      gradient: 'var(--admin-gradient-rose)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    },
    {
      label: 'Escrow Volume',
      value: stats?.escrowVolume ? `${parseFloat(stats.escrowVolume).toFixed(2)} ETH` : '0 ETH',
      gradient: 'var(--admin-gradient-cyan)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
    },
    {
      label: 'Fraud Alerts',
      value: alertsData?.length || 0,
      gradient: 'var(--admin-gradient-amber)',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
      LOCKED: 'bg-blue-50 text-blue-700 border border-blue-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      REFUNDED: 'bg-violet-50 text-violet-700 border border-violet-200',
      DISPUTED: 'bg-rose-50 text-rose-700 border border-rose-200',
      CANCELLED: 'bg-slate-50 text-slate-600 border border-slate-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {kpiCards.map((card, i) => (
          <div key={i} className="admin-card p-5 flex items-start justify-between group hover:shadow-admin-elevated transition-shadow duration-200">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{card.value}</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 opacity-90" style={{ background: card.gradient }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="admin-card xl:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pending Property Approvals</h2>
              <p className="text-xs text-slate-400 mt-0.5">{pendingData?.length || 0} properties awaiting review</p>
            </div>
            <Link href="/admin/properties" className="admin-btn-ghost text-xs">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingData && pendingData.length > 0 ? pendingData.slice(0, 5).map((prop: Record<string, unknown>) => (
              <div key={prop.id as number} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m16.5-18v18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{prop.title as string}</p>
                    <p className="text-xs text-slate-400">{prop.district as string} &middot; by {(prop.owner as Record<string, string>)?.name}</p>
                  </div>
                </div>
                <span className="admin-badge bg-amber-50 text-amber-700 border border-amber-200">Pending</span>
              </div>
            )) : (
              <div className="px-6 py-10 text-center text-sm text-slate-400">No pending approvals</div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="admin-card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Users</h2>
            <Link href="/admin/users" className="admin-btn-ghost text-xs">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers && recentUsers.length > 0 ? recentUsers.slice(0, 6).map((u: Record<string, unknown>) => (
              <div key={u.id as number} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {(u.name as string)?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{u.name as string}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email as string}</p>
                </div>
                <span className={`admin-badge text-[10px] ${
                  u.role === 'ADMIN' ? 'bg-violet-50 text-violet-700' :
                  u.role === 'OWNER' ? 'bg-blue-50 text-blue-700' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  {u.role as string}
                </span>
              </div>
            )) : (
              <div className="px-6 py-10 text-center text-sm text-slate-400">No users found</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="admin-card xl:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="admin-btn-ghost text-xs">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left admin-table-header">ID</th>
                  <th className="px-6 py-3 text-left admin-table-header">Property</th>
                  <th className="px-6 py-3 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3 text-left admin-table-header">Amount</th>
                  <th className="px-6 py-3 text-left admin-table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookingsData?.bookings && bookingsData.bookings.length > 0 ? bookingsData.bookings.slice(0, 5).map((b: Record<string, unknown>) => {
                  const property = b.property as Record<string, unknown>;
                  return (
                    <tr key={b.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-sm font-mono text-slate-500">#{b.id as number}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{(property?.title as string) || '-'}</td>
                      <td className="px-6 py-3"><span className={`admin-badge text-[10px] ${getStatusBadge(b.status as string)}`}>{b.status as string}</span></td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-800 tabular-nums">{b.escrowAmount ? `${b.escrowAmount} ETH` : '-'}</td>
                      <td className="px-6 py-3 text-xs text-slate-400">{formatDate(b.createdAt as string)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="admin-card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Fraud Alerts</h2>
            <Link href="/admin/fraud" className="admin-btn-ghost text-xs">View All</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {alertsData && alertsData.length > 0 ? alertsData.slice(0, 5).map((alert: Record<string, unknown>) => (
              <div key={alert.id as number} className="px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`admin-badge text-[10px] ${
                    alert.severity === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {alert.severity as string}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{alert.alertType as string}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{alert.description as string}</p>
              </div>
            )) : (
              <div className="px-6 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No active alerts</p>
                <p className="text-xs text-slate-400 mt-0.5">System is clean</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
