'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface TokenEntry {
  id: number;
  amount: number;
  type: string;
  description: string;
  bookingId: number | null;
  createdAt: string;
}

export default function RewardsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemDesc, setRedeemDesc] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return; }
    if (user) fetchData();
  }, [user, authLoading, page]);

  function fetchData() {
    setLoading(true);
    Promise.all([
      api.get('/extras/rewards/balance'),
      api.get(`/extras/rewards/history?page=${page}&limit=10`),
    ]).then(([balRes, histRes]) => {
      setBalance(balRes.data.balance);
      setHistory(histRes.data.tokens || []);
      setTotalPages(histRes.data.totalPages || 1);
    }).catch(() => toast.error('Failed to load rewards data'))
    .finally(() => setLoading(false));
  }

  async function handleRedeem() {
    const amount = parseFloat(redeemAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > balance) { toast.error('Insufficient balance'); return; }
    setRedeeming(true);
    try {
      await api.post('/extras/rewards/redeem', { amount, description: redeemDesc || 'Reward redemption' });
      toast.success(`Redeemed ${amount} tokens!`);
      setRedeemAmount(''); setRedeemDesc('');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Redemption failed');
    } finally { setRedeeming(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800">{t('rewards.title')}</h1>
        <p className="text-slate-500 mt-2">{t('rewards.subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="mt-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-8 text-white shadow-lg">
              <p className="text-sm opacity-80">{t('rewards.your_balance')}</p>
              <p className="text-5xl font-bold mt-2">{balance.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-1">{t('rewards.reward_tokens')}</p>
            </div>

            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('rewards.redeem')}</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="number" placeholder="Amount" value={redeemAmount} onChange={e => setRedeemAmount(e.target.value)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                <input type="text" placeholder={t('rewards.description_optional')} value={redeemDesc} onChange={e => setRedeemDesc(e.target.value)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                <button onClick={handleRedeem} disabled={redeeming} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">{redeeming ? t('common.loading') : t('rewards.redeem_btn')}</button>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('rewards.history')}</h3>
              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-8">{t('rewards.no_history')}</p>
              ) : (
                <div className="space-y-3">
                  {history.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{tx.description || tx.type}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50">{t('common.pagination_previous')}</button>
                  <span className="px-3 py-1 text-sm text-slate-500">{t('common.pagination_page')} {page} {t('common.pagination_of')} {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-slate-100 rounded-lg text-sm disabled:opacity-50">{t('common.pagination_next')}</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
