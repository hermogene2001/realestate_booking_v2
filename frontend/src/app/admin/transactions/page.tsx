'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ETHERSCAN_URL, IS_LOCAL_NETWORK } from '@/lib/contract';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';

export default function AdminTransactionsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/transactions?page=${page}&limit=20`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      DEPOSIT: 'bg-blue-50 text-blue-700 border border-blue-200',
      RELEASE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      REFUND: 'bg-violet-50 text-violet-700 border border-violet-200',
      PENALTY: 'bg-rose-50 text-rose-700 border border-rose-200',
      FEE: 'bg-amber-50 text-amber-700 border border-amber-200',
    };
    return styles[type] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      CONFIRMED: 'bg-emerald-400',
      PENDING: 'bg-amber-400',
      FAILED: 'bg-rose-400',
    };
    return colors[status] || 'bg-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-5">
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{data?.total || 0}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Current Page</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{page} / {totalPages}</p>
        </div>
        <div className="admin-card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Explorer</p>
          {IS_LOCAL_NETWORK ? (
            <p className="text-sm text-slate-500">Local Hardhat network — no block explorer</p>
          ) : (
            <a href={ETHERSCAN_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View on Etherscan &rarr;
            </a>
          )}
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
                  <th className="px-6 py-3.5 text-left admin-table-header">Type</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Amount</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Property / Booking</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Tx Hash</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.transactions?.map((tx: Record<string, unknown>) => {
                  const booking = tx.booking as Record<string, unknown>;
                  const property = booking?.property as Record<string, unknown>;
                  return (
                    <tr key={tx.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-slate-500">#{tx.id as number}</td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${getTypeBadge(tx.type as string)}`}>
                          {tx.type as string}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800 tabular-nums">{tx.amount as string} ETH</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-slate-700">{(property?.title as string) || '-'}</p>
                        <p className="text-xs text-slate-400">Booking #{booking?.id as number}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        {tx.txHash ? (
                          IS_LOCAL_NETWORK ? (
                            <span className="text-xs font-mono text-slate-500">
                              {(tx.txHash as string).slice(0, 14)}...
                            </span>
                          ) : (
                            <a
                              href={`${ETHERSCAN_URL}/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {(tx.txHash as string).slice(0, 10)}...{(tx.txHash as string).slice(-6)}
                            </a>
                          )
                        ) : (
                          <span className="text-xs text-slate-300">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(tx.status as string)}`} />
                          <span className="text-xs font-medium text-slate-600">{tx.status as string}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDateTime(tx.createdAt as string)}</td>
                    </tr>
                  );
                })}
                {(!data?.transactions || data.transactions.length === 0) && (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">No transactions recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
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
