'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export default function AdminCommissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-commissions', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/commissions?page=${page}&limit=20`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleMarkPaid = async (id: number) => {
    try {
      await api.patch(`/admin/commissions/${id}/pay`);
      toast.success('Commission marked as paid');
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
    } catch { toast.error('Failed to update commission'); }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const ps = data?.platformStats;

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Platform Revenue', value: `${Number(ps?.totalRevenue || 0).toFixed(4)} ETH`, gradient: 'var(--admin-gradient-emerald)' },
          { label: 'Total Volume', value: `${Number(ps?.totalVolume || 0).toFixed(4)} ETH`, gradient: 'var(--admin-gradient-blue)' },
          { label: 'Total Bookings', value: ps?.totalBookings || 0, gradient: 'var(--admin-gradient-violet)' },
        ].map((s, i) => (
          <div key={i} className="admin-card p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: s.gradient }} />
          </div>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left admin-table-header">ID</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Property</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Owner</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Total</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Platform Fee</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Owner Gets</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Rate</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Date</th>
                  <th className="px-6 py-3.5 text-right admin-table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.commissions?.map((c: Record<string, unknown>) => {
                  const booking = c.booking as Record<string, unknown>;
                  const property = (booking?.property as Record<string, unknown>);
                  const owner = c.owner as Record<string, string>;
                  return (
                    <tr key={c.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-slate-500">#{c.id as number}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 max-w-[160px] truncate">{property?.title as string || '-'}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-800">{owner?.name}</p>
                        <p className="text-xs text-slate-400">{owner?.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800 tabular-nums">{Number(c.totalAmount).toFixed(4)} ETH</td>
                      <td className="px-6 py-3.5 text-sm text-rose-600 tabular-nums">{Number(c.platformFee).toFixed(4)} ETH</td>
                      <td className="px-6 py-3.5 text-sm text-emerald-600 tabular-nums">{Number(c.ownerReceives).toFixed(4)} ETH</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{c.commissionRate as number}%</td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {c.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(c.createdAt as string)}</td>
                      <td className="px-6 py-3.5 text-right">
                        {c.status !== 'PAID' && (
                          <button onClick={() => handleMarkPaid(c.id as number)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!data?.commissions || data.commissions.length === 0) && (
                  <tr><td colSpan={10} className="px-6 py-16 text-center text-sm text-slate-400">No commissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
