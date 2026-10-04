'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AgentProfile {
  id: number;
  userId: number;
  licenseNumber: string;
  agency: string | null;
  specialty: string | null;
  rating: number;
  totalSales: number;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  user?: { id: number; name: string; email: string };
}

export default function AgentPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ licenseNumber: '', agency: '', specialty: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) fetchAgent();
  }, [user, authLoading]);

  async function fetchAgent() {
    try {
      const { data } = await api.get('/extras/agents/me');
      setAgent(data);
    } catch { setAgent(null); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/extras/agents/register', form);
      setAgent(data);
      toast.success('Registered as agent!');
      setShowRegister(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800">{t('agent.title')}</h1>
        <p className="text-slate-500 mt-2">{t('agent.subtitle')}</p>

        {!agent && !showRegister && (
          <div className="mt-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
            <svg className="w-16 h-16 text-blue-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <h3 className="text-xl font-semibold text-slate-700 mt-4">{t('agent.become')}</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">{t('agent.become_desc')}</p>
            <button onClick={() => setShowRegister(true)} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{t('agent.register_btn')}</button>
          </div>
        )}

        {showRegister && (
          <form onSubmit={handleRegister} className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{t('agent.registration')}</h3>
            <input type="text" placeholder={t('agent.license_placeholder')} value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" placeholder={t('agent.agency_placeholder')} value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <textarea placeholder={t('agent.specialty_placeholder')} value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.loading') : t('common.submit')}</button>
              <button type="button" onClick={() => setShowRegister(false)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">{t('common.cancel')}</button>
            </div>
          </form>
        )}

        {agent && (
          <div className="mt-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {agent.user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-800">{agent.user?.name || 'Agent'}</h3>
                    {agent.isVerified && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">{t('agent.verified')}</span>}
                  </div>
                  <p className="text-sm text-slate-500">{t('agent.license')}: {agent.licenseNumber}</p>
                  {agent.agency && <p className="text-sm text-slate-500">{agent.agency}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-3xl font-bold text-blue-600">{agent.rating.toFixed(1)}</p>
                <p className="text-sm text-slate-500 mt-1">{t('agent.rating')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-3xl font-bold text-emerald-600">{agent.totalSales}</p>
                <p className="text-sm text-slate-500 mt-1">{t('agent.total_sales')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
                <p className="text-3xl font-bold text-amber-600">{agent.totalSales > 0 ? (agent.rating / agent.totalSales).toFixed(2) : '-'}</p>
                <p className="text-sm text-slate-500 mt-1">{t('agent.avg_rating_per_sale')}</p>
              </div>
            </div>

            {agent.specialty && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h4 className="text-sm font-medium text-slate-600 mb-2">{t('agent.specialty')}</h4>
                <p className="text-slate-800">{agent.specialty}</p>
              </div>
            )}

            {!agent.isVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                {t('agent.pending_verification')}
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3">{t('agent.agent_tools')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => router.push('/admin/properties')} className="text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-slate-700">{t('agent.manage_listings')}</p>
                  <p className="text-xs text-slate-400">{t('agent.manage_listings_desc')}</p>
                </button>
                <button onClick={() => router.push('/admin/bookings')} className="text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-slate-700">{t('agent.view_bookings')}</p>
                  <p className="text-xs text-slate-400">{t('agent.view_bookings_desc')}</p>
                </button>
                <button onClick={() => router.push('/admin/commissions')} className="text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-slate-700">{t('agent.commission_reports')}</p>
                  <p className="text-xs text-slate-400">{t('agent.commission_reports_desc')}</p>
                </button>
                <button onClick={() => router.push('/rewards')} className="text-left px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="font-medium text-slate-700">{t('agent.rewards_tokens')}</p>
                  <p className="text-xs text-slate-400">{t('agent.rewards_tokens_desc')}</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
