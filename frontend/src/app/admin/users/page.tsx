'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleBan = async (userId: number, ban: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`, { isBanned: ban });
      toast.success(ban ? 'User has been banned' : 'User has been unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Action failed'); }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch { toast.error('Failed to update role'); }
  };

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-violet-50 text-violet-700 border border-violet-200',
      OWNER: 'bg-blue-50 text-blue-700 border border-blue-200',
      TENANT: 'bg-slate-50 text-slate-600 border border-slate-200',
    };
    return styles[role] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="admin-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users by name or email..."
              className="admin-input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="admin-select min-w-[140px]"
          >
            <option value="">All Roles</option>
            <option value="TENANT">Tenant</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
            <span className="tabular-nums font-medium">{data?.total || 0}</span>
            <span>total users</span>
          </div>
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
                  <th className="px-6 py-3.5 text-left admin-table-header">User</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Role</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Wallet</th>
                  <th className="px-6 py-3.5 text-center admin-table-header">Props</th>
                  <th className="px-6 py-3.5 text-center admin-table-header">Books</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Joined</th>
                  <th className="px-6 py-3.5 text-right admin-table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.users?.map((u: Record<string, unknown>) => {
                  const counts = u._count as Record<string, number>;
                  return (
                    <tr key={u.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                            {(u.name as string)?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{u.name as string}</p>
                            <p className="text-xs text-slate-400">{u.email as string}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <select
                          value={u.role as string}
                          onChange={e => handleRoleChange(u.id as number, e.target.value)}
                          className="text-xs bg-transparent border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="TENANT">Tenant</option>
                          <option value="OWNER">Owner</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`admin-badge text-[10px] ${u.isBanned ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {u.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {u.walletAddress ? (
                          <span className="text-xs font-mono text-slate-500">{(u.walletAddress as string).slice(0, 6)}...{(u.walletAddress as string).slice(-4)}</span>
                        ) : (
                          <span className="text-xs text-slate-300">Not linked</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center text-sm tabular-nums text-slate-600">{counts?.properties || 0}</td>
                      <td className="px-6 py-3.5 text-center text-sm tabular-nums text-slate-600">{counts?.bookings || 0}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(u.createdAt as string)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleBan(u.id as number, !u.isBanned)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                            u.isBanned
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!data?.users || data.users.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, data?.total || 0)} of {data?.total || 0} users
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="admin-btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                    p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="admin-btn-ghost text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
