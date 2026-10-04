'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

const PROPERTY_STATUSES = ['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'DELISTED'];
const APPROVAL_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Approved', value: 'true' },
  { label: 'Pending', value: 'false' },
];

export default function AdminPropertyStatusPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-property-status', page, statusFilter, approvalFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (approvalFilter) params.set('isApproved', approvalFilter);
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/properties/status?${params}`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      BOOKED: 'bg-blue-50 text-blue-700 border border-blue-200',
      MAINTENANCE: 'bg-amber-50 text-amber-700 border border-amber-200',
      DELISTED: 'bg-slate-100 text-slate-500 border border-slate-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  const getApprovalBadge = (approved: boolean) =>
    approved
      ? 'bg-green-100 text-green-700 border border-green-200'
      : 'bg-yellow-100 text-yellow-700 border border-yellow-200';

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="admin-card p-5 space-y-4">
        <input
          type="text"
          placeholder="Search by title, location, or district..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          <button onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !statusFilter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>All</button>
          {PROPERTY_STATUSES.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}>{s}</button>
          ))}
          <span className="w-px h-5 bg-slate-200 mx-2" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Approval:</span>
          {APPROVAL_FILTERS.map(f => (
            <button key={f.value} onClick={() => { setApprovalFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                approvalFilter === f.value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}>{f.label}</button>
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
                  <th className="px-6 py-3.5 text-left admin-table-header">Title</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Location</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Owner</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Price</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Approved</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Bookings</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.properties?.map((p: Record<string, unknown>) => (
                  <tr key={p.id as number} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/properties/${p.id}`} className="text-sm font-mono text-blue-600 hover:text-blue-700">
                        #{p.id as number}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-slate-700 font-medium truncate max-w-[200px]">{p.title as string}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 truncate max-w-[150px]">
                      {p.location as string}, {p.district as string}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-slate-600">{(p.owner as any)?.name as string}</p>
                      <p className="text-xs text-slate-400">{(p.owner as any)?.email as string}</p>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800 tabular-nums">{p.priceEth as string} ETH</td>
                    <td className="px-6 py-3.5">
                      <span className={`admin-badge text-[10px] ${getStatusBadge(p.status as string)}`}>
                        {p.status as string}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`admin-badge text-[10px] ${getApprovalBadge(p.isApproved as boolean)}`}>
                        {p.isApproved ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 text-center tabular-nums">
                      {(p._count as any)?.bookings || 0}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {new Date(p.createdAt as string).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!data?.properties || data.properties.length === 0) && (
                  <tr><td colSpan={9} className="px-6 py-16 text-center text-sm text-slate-400">No properties found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="admin-btn-ghost text-xs disabled:opacity-30">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="admin-btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
