'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [processing, setProcessing] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['dispute-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/disputes/stats'); return data; },
    enabled: user?.role === 'ADMIN',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/disputes?${params}`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleResolve = async () => {
    if (!resolution.trim()) { toast.error('Please enter a resolution'); return; }
    setProcessing(true);
    try {
      await api.patch(`/admin/disputes/${(selected as Record<string, unknown>).id}/resolve`, { resolution, status: resolveStatus });
      toast.success(`Dispute ${resolveStatus.toLowerCase()}`);
      setSelected(null);
      setResolution('');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['dispute-stats'] });
    } catch { toast.error('Failed to resolve dispute'); }
    finally { setProcessing(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      OPEN: 'bg-amber-50 text-amber-700 border border-amber-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
    return map[s] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats?.total || 0, color: 'var(--admin-gradient-blue)' },
          { label: 'Open', value: stats?.open || 0, color: 'var(--admin-gradient-amber)' },
          { label: 'Resolved', value: stats?.resolved || 0, color: 'var(--admin-gradient-emerald)' },
          { label: 'Rejected', value: stats?.rejected || 0, color: 'var(--admin-gradient-rose)' },
          { label: 'This Month', value: stats?.thisMonth || 0, color: 'var(--admin-gradient-violet)' },
        ].map((s, i) => (
          <div key={i} className="admin-card p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            <div className="w-full h-1 rounded-full bg-slate-100 mt-2">
              <div className="h-1 rounded-full" style={{ background: s.color, width: s.value ? '100%' : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex items-center gap-2 flex-wrap">
        {['', 'OPEN', 'RESOLVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {s || 'All'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{data?.total || 0} total</span>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left admin-table-header">ID</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Property</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Raised By</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Against</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Reason</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Date</th>
                  <th className="px-6 py-3.5 text-right admin-table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.disputes?.map((d: Record<string, unknown>) => {
                  const booking = d.booking as Record<string, unknown>;
                  const property = (booking?.property as Record<string, unknown>);
                  const raisedBy = d.raisedByUser as Record<string, string>;
                  const against = d.againstUser as Record<string, string>;
                  return (
                    <tr key={d.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-slate-500">#{d.id as number}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 max-w-[160px] truncate">{property?.title as string || '-'}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-700">{raisedBy?.name}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-700">{against?.name}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 max-w-[200px]">
                        <p className="line-clamp-2">{d.reason as string}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${statusBadge(d.status as string)}`}>{d.status as string}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(d.createdAt as string)}</td>
                      <td className="px-6 py-3.5 text-right">
                        {d.status === 'OPEN' && (
                          <button onClick={() => setSelected(d)} className="text-xs font-medium px-3 py-1.5 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!data?.disputes || data.disputes.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">No disputes found</td></tr>
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

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Resolve Dispute #{(selected as Record<string, unknown>).id as number}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Reason</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{(selected as Record<string, unknown>).reason as string}</p>
              </div>
              <div className="flex gap-2">
                {(['RESOLVED', 'REJECTED'] as const).map(s => (
                  <button key={s} onClick={() => setResolveStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${resolveStatus === s ? (s === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resolution Notes</label>
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
                  className="admin-input resize-none" placeholder="Describe the resolution..." />
              </div>
              <button onClick={handleResolve} disabled={processing}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${resolveStatus === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}>
                {processing ? 'Processing...' : `Mark as ${resolveStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
