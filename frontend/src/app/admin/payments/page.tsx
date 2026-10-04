'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/payments?page=${page}&limit=20`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const methodBadge = (m: string) => {
    const map: Record<string, string> = {
      MOMO: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      CARD: 'bg-blue-50 text-blue-700 border border-blue-200',
      ETHEREUM: 'bg-violet-50 text-violet-700 border border-violet-200',
    };
    return map[m] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
      FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
      REFUNDED: 'bg-violet-50 text-violet-700 border border-violet-200',
    };
    return map[s] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-5">
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{data?.total || 0}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Volume</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {data?.totalAmount ? Number(data.totalAmount).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Page</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{page} / {totalPages}</p>
        </div>
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
                  <th className="px-6 py-3.5 text-left admin-table-header">User</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Property</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Method</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Amount</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Currency</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.payments?.map((p: Record<string, unknown>) => {
                  const pUser = p.user as Record<string, string>;
                  const booking = p.booking as Record<string, unknown>;
                  const property = (booking?.property as Record<string, unknown>);
                  return (
                    <tr key={p.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-slate-500">#{p.id as number}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-800">{pUser?.name}</p>
                        <p className="text-xs text-slate-400">{pUser?.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 max-w-[180px] truncate">
                        {property?.title as string || '-'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${methodBadge(p.paymentMethod as string)}`}>
                          {p.paymentMethod as string}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800 tabular-nums">
                        {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{p.currency as string}</td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${statusBadge(p.status as string)}`}>
                          {p.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDateTime(p.createdAt as string)}</td>
                    </tr>
                  );
                })}
                {(!data?.payments || data.payments.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">No payments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages} · {data?.total || 0} total</p>
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
