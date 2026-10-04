'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/bookings?${params}`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 1;
  const statuses = ['PENDING', 'LOCKED', 'COMPLETED', 'REFUNDED', 'DISPUTED', 'CANCELLED'];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
      LOCKED: 'bg-blue-50 text-blue-700 border border-blue-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      REFUNDED: 'bg-violet-50 text-violet-700 border border-violet-200',
      DISPUTED: 'bg-rose-50 text-rose-700 border border-rose-200',
      CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Status Filters */}
      <div className="admin-card p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !statusFilter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 tabular-nums">{data?.total || 0} total</span>
        </div>
      </div>

      {/* Table */}
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
                  <th className="px-6 py-3.5 text-left admin-table-header">Tenant</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Escrow</th>
                  <th className="px-6 py-3.5 text-center admin-table-header">Confirmations</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Period</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.bookings?.map((b: Record<string, unknown>) => {
                  const property = b.property as Record<string, unknown>;
                  const tenant = b.tenant as Record<string, unknown>;
                  return (
                    <tr key={b.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link href={`/bookings/${b.id}`} className="text-sm font-mono text-blue-600 hover:text-blue-700">
                          #{b.id as number}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-slate-700 truncate max-w-[200px]">{(property?.title as string) || '-'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {(tenant?.name as string)?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-slate-600">{(tenant?.name as string) || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${getStatusBadge(b.status as string)}`}>
                          {b.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-800 tabular-nums">
                        {b.escrowAmount ? `${b.escrowAmount} ETH` : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${b.tenantConfirmed ? 'bg-emerald-400' : 'bg-slate-200'}`} title="Tenant" />
                          <span className={`w-2 h-2 rounded-full ${b.ownerConfirmed ? 'bg-emerald-400' : 'bg-slate-200'}`} title="Owner" />
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">
                        {formatDate(b.startDate as string)} - {formatDate(b.endDate as string)}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(b.createdAt as string)}</td>
                    </tr>
                  );
                })}
                {(!data?.bookings || data.bookings.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
