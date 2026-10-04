'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface PromoForm {
  code: string;
  description: string;
  discountPercent: string;
  discountAmount: string;
  maxUses: string;
  validUntil: string;
}

const emptyForm: PromoForm = { code: '', description: '', discountPercent: '', discountAmount: '', maxUses: '', validUntil: '' };

export default function AdminPromoCodesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promo-codes', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/promo-codes?page=${page}&limit=20`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) { toast.error('Code is required'); return; }
    if (!form.discountPercent && !form.discountAmount) { toast.error('Enter a discount percent or amount'); return; }
    setSaving(true);
    try {
      await api.post('/admin/promo-codes', {
        code: form.code,
        description: form.description || undefined,
        discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : undefined,
        discountAmount: form.discountAmount ? parseFloat(form.discountAmount) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
      });
      toast.success('Promo code created');
      setForm(emptyForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to create promo code');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.patch(`/admin/promo-codes/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'Promo code deactivated' : 'Promo code activated');
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
    } catch { toast.error('Failed to delete'); }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Stats + Create Button */}
      <div className="flex items-start gap-5">
        <div className="grid grid-cols-3 gap-4 flex-1">
          {[
            { label: 'Total Codes', value: stats?.total || 0 },
            { label: 'Active', value: stats?.active || 0 },
            { label: 'Total Uses', value: stats?.totalUses || 0 },
          ].map((s, i) => (
            <div key={i} className="admin-card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="admin-btn-primary flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Promo Code
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="admin-card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Create Promo Code</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="admin-input" placeholder="SUMMER20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="admin-input" placeholder="Summer discount" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Discount % (or leave blank)</label>
              <input type="number" min="0" max="100" value={form.discountPercent}
                onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value, discountAmount: '' }))}
                className="admin-input" placeholder="10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Discount Amount ETH (or leave blank)</label>
              <input type="number" min="0" step="0.001" value={form.discountAmount}
                onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value, discountPercent: '' }))}
                className="admin-input" placeholder="0.05" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Max Uses (0 = unlimited)</label>
              <input type="number" min="0" value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="admin-input" placeholder="100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valid Until</label>
              <input type="date" value={form.validUntil}
                onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="admin-input" />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="admin-btn-primary">
                {saving ? 'Creating...' : 'Create Code'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }} className="admin-btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                  <th className="px-6 py-3.5 text-left admin-table-header">Code</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Description</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Discount</th>
                  <th className="px-6 py-3.5 text-center admin-table-header">Uses</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Valid Until</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Status</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Created</th>
                  <th className="px-6 py-3.5 text-right admin-table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.promoCodes?.map((p: Record<string, unknown>) => (
                  <tr key={p.id as number} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {p.code as string}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{(p.description as string) || '—'}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">
                      {(p.discountPercent as number) > 0 ? `${p.discountPercent}%` : `${p.discountAmount} ETH`}
                    </td>
                    <td className="px-6 py-3.5 text-center text-sm tabular-nums text-slate-600">
                      {p.usedCount as number}{(p.maxUses as number) > 0 ? ` / ${p.maxUses}` : ''}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">
                      {p.validUntil ? formatDate(p.validUntil as string) : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`admin-badge text-[10px] ${p.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(p.createdAt as string)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleToggle(p.id as number, p.isActive as boolean)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${p.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}>
                          {p.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(p.id as number)}
                          className="text-xs font-medium px-2.5 py-1.5 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.promoCodes || data.promoCodes.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-400">No promo codes yet</td></tr>
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
