'use client';

import { Suspense, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

function MomoBridgeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [step, setStep] = useState<'initiate' | 'confirm'>('initiate');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) { router.push('/login'); return null; }

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) { toast.error('No booking selected'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/momo/initiate', {
        bookingId: parseInt(bookingId),
        amount: parseFloat(amount),
        phoneNumber: phone,
      });
      setPaymentId(data.paymentId);
      setStep('confirm');
      toast.success('Payment initiated! Check your phone for the MoMo prompt.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to initiate payment');
    } finally { setLoading(false); }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId) return;
    setLoading(true);
    try {
      await api.post('/payments/momo/confirm', { paymentId, transactionRef });
      toast.success('Payment confirmed successfully!');
      router.push(bookingId ? `/bookings/${bookingId}` : '/payments');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Confirmation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MoMo Payment</h1>
          <p className="text-gray-500 mt-1 text-sm">Pay securely with MTN Mobile Money</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Initiate', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                (i === 0 && step === 'initiate') || (i === 1 && step === 'confirm')
                  ? 'bg-primary-600 text-white'
                  : i === 0 && step === 'confirm'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i === 0 && step === 'confirm' ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === (i === 0 ? 'initiate' : 'confirm') ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              {i === 0 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-8">
          {step === 'initiate' ? (
            <form onSubmit={handleInitiate} className="space-y-5">
              {bookingId && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800">
                  Paying for Booking <span className="font-bold">#{bookingId}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (RWF)</label>
                <input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="e.g. 50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">MTN Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="+250 7XX XXX XXX" />
                <p className="text-xs text-gray-400 mt-1">You will receive a MoMo prompt on this number</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {loading ? 'Initiating...' : 'Send MoMo Request'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">✅ MoMo request sent!</p>
                <p>Check your phone and approve the payment. Then enter the transaction reference below.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Reference</label>
                <input type="text" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="e.g. MOMO123456789" />
                <p className="text-xs text-gray-400 mt-1">Found in your MoMo SMS confirmation</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {loading ? 'Confirming...' : 'Confirm Payment'}
              </button>
              <button type="button" onClick={() => setStep('initiate')}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Need help?{' '}
          <Link href="/messages" className="text-primary-600 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

export default function MomoBridgePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <MomoBridgeContent />
    </Suspense>
  );
}