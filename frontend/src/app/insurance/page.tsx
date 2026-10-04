'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface InsuranceRecord {
  id: number;
  bookingId: number;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  status: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  booking?: {
    id: number;
    property: { title: string };
    tenant: { name: string; email: string };
  };
}

export default function InsurancePage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [insurances, setInsurances] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bookingId: '', provider: 'Radiant Insurance', coverageAmount: '', premium: '', validFrom: '', validUntil: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) fetchInsurances();
  }, [user, authLoading]);

  async function fetchInsurances() {
    try {
      const { data } = await api.get('/extras/insurance/active');
      setInsurances(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/extras/insurance', {
        bookingId: parseInt(form.bookingId),
        provider: form.provider,
        policyNumber: `POL-${Date.now()}`,
        coverageAmount: parseFloat(form.coverageAmount),
        premium: parseFloat(form.premium),
        validFrom: new Date(form.validFrom),
        validUntil: new Date(form.validUntil),
      });
      toast.success('Insurance policy created!');
      setShowForm(false);
      setForm({ bookingId: '', provider: 'Radiant Insurance', coverageAmount: '', premium: '', validFrom: '', validUntil: '' });
      fetchInsurances();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create insurance');
    } finally { setSaving(false); }
  }

  async function handleCancel(bookingId: number) {
    if (!confirm('Cancel this insurance policy?')) return;
    try {
      await api.put(`/extras/insurance/${bookingId}/cancel`);
      toast.success('Insurance cancelled');
      fetchInsurances();
    } catch { toast.error('Failed to cancel insurance'); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('insurance.title')}</h1>
            <p className="text-slate-500 mt-2">{t('insurance.subtitle')}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {showForm ? t('common.cancel') : t('insurance.new_policy')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{t('insurance.create_policy')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" placeholder="Booking ID" value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="text" placeholder="Provider" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="number" step="0.01" placeholder={t('insurance.coverage_placeholder')} value={form.coverageAmount} onChange={e => setForm(f => ({ ...f, coverageAmount: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="number" step="0.01" placeholder={t('insurance.premium_placeholder')} value={form.premium} onChange={e => setForm(f => ({ ...f, premium: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="date" placeholder="Valid From" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="date" placeholder="Valid Until" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} required className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">{saving ? t('common.loading') : t('insurance.create_policy_btn')}</button>
          </form>
        )}

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : insurances.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <p className="text-slate-400 mt-4">{t('insurance.no_policies')}</p>
            </div>
          ) : (
            insurances.map(ins => (
              <div key={ins.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ins.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ins.status === 'ACTIVE' ? t('insurance.active') : t('insurance.expired')}</span>
                    <span className="text-sm font-medium text-slate-700">{ins.provider}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{t('insurance.policy')}: {ins.policyNumber} | {t('insurance.coverage')}: ${ins.coverageAmount} | {t('insurance.premium')}: ${ins.premium}</p>
                  {ins.booking?.property && <p className="text-xs text-slate-400 mt-1">Property: {ins.booking.property.title}</p>}
                  <p className="text-xs text-slate-400">Valid: {new Date(ins.validFrom).toLocaleDateString()} - {new Date(ins.validUntil).toLocaleDateString()}</p>
                </div>
                  {ins.status === 'ACTIVE' && (
                    <button onClick={() => handleCancel(ins.bookingId)} className="text-sm text-red-500 hover:text-red-700">{t('common.cancel')}</button>
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
