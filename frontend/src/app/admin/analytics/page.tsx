'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const { data: overview, isLoading, error: overviewError } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => { const { data } = await api.get('/analytics/overview'); return data; },
  });

  const { data: userStats, error: userError } = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => { const { data } = await api.get('/analytics/users'); return data; },
  });

  const { data: propertyStats, error: propertyError } = useQuery({
    queryKey: ['analytics-properties'],
    queryFn: async () => { const { data } = await api.get('/analytics/properties'); return data; },
  });

  const { data: bookingStats, error: bookingError } = useQuery({
    queryKey: ['analytics-bookings'],
    queryFn: async () => { const { data } = await api.get('/analytics/bookings'); return data; },
  });

  const { data: fraudStats, error: fraudError } = useQuery({
    queryKey: ['analytics-fraud'],
    queryFn: async () => { const { data } = await api.get('/analytics/fraud'); return data; },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const errors = [overviewError, userError, propertyError, bookingError, fraudError].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
        <p className="text-slate-500 mt-1">Comprehensive platform analytics and insights</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Analytics data could not be loaded from one or more API endpoints. Confirm the backend is running,
          you are logged in as ADMIN, and the database has analytics records.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Users" value={overview?.totalUsers ?? 0} gradient="from-blue-500 to-blue-700" />
        <KPICard label="Properties" value={overview?.totalProperties ?? 0} gradient="from-emerald-500 to-emerald-700" />
        <KPICard label="Bookings" value={overview?.totalBookings ?? 0} gradient="from-violet-500 to-violet-700" />
        <KPICard label="Revenue" value={`$${(overview?.totalRevenue ?? 0).toFixed(2)}`} gradient="from-amber-500 to-amber-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">User Analytics</h3>
          <div className="space-y-3">
            <StatRow label="Total Users" value={userStats?.total ?? 0} />
            <StatRow label="Active (30 days)" value={userStats?.activeLast30Days ?? 0} />
            <StatRow label="KYC Verified" value={userStats?.kycVerified ?? 0} />
            <StatRow label="2FA Enabled" value={userStats?.twoFactorEnabled ?? 0} />
          </div>
          {userStats?.byRole && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-600 mb-2">By Role</p>
              <div className="flex gap-3">
                {Object.entries(userStats.byRole).map(([role, count]) => (
                  <span key={role} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">{role}: {count as number}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Property Analytics</h3>
          <div className="space-y-3">
            <StatRow label="Total" value={propertyStats?.total ?? 0} />
            {propertyStats?.byStatus && Object.entries(propertyStats.byStatus).map(([status, count]) => (
              <StatRow key={status} label={`Status: ${status}`} value={count as number} />
            ))}
          </div>
          {propertyStats?.avgStats && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-600 mb-2">Average Stats</p>
              <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                <span>Bedrooms: {propertyStats.avgStats._avg?.bedrooms?.toFixed(1) ?? '-'}</span>
                <span>Bathrooms: {propertyStats.avgStats._avg?.bathrooms?.toFixed(1) ?? '-'}</span>
                <span>Area: {propertyStats.avgStats._avg?.area?.toFixed(0) ?? '-'} sqm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Bookings</h3>
          <div className="space-y-3">
            <StatRow label="Total" value={bookingStats?.total ?? 0} />
            {bookingStats?.byStatus && Object.entries(bookingStats.byStatus).map(([status, count]) => (
              <StatRow key={status} label={status as string} value={count as number} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Fraud Detection</h3>
          <div className="space-y-3">
            <StatRow label="Total Alerts" value={fraudStats?.totalAlerts ?? 0} />
            <StatRow label="Resolved" value={fraudStats?.resolved ?? 0} />
            <StatRow label="Unresolved" value={fraudStats?.unresolved ?? 0} />
            <StatRow label="Resolve Rate" value={`${fraudStats?.resolveRate ?? 0}%`} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Trends</h3>
          {overview?.monthlyStats?.length > 0 ? (
            <div className="space-y-2">
              {overview.monthlyStats.map((m: Record<string, unknown>) => (
                <div key={m.month as string} className="flex justify-between text-sm">
                  <span className="text-slate-600">{m.month as string}</span>
                  <span className="font-medium text-slate-800">{m.bookings as number} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, gradient }: { label: string; value: number | string; gradient: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}
