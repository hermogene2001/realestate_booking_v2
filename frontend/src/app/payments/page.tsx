'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function PaymentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => { const { data } = await api.get('/payments/stats'); return data; },
    enabled: !!user,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => { const { data } = await api.get('/payments/my-payments?limit=50'); return data; },
    enabled: !!user,
  });

  if (!user) { router.push('/login'); return null; }

  const methodBadge = (m: string) => {
    const map: Record<string, string> = {
      MOMO: 'bg-yellow-100 text-yellow-800',
      CARD: 'bg-blue-100 text-blue-800',
      ETHEREUM: 'bg-violet-100 text-violet-800',
    };
    return map[m] || 'bg-gray-100 text-gray-700';
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
    };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Payments</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Payments', value: stats?.total || 0, color: 'text-gray-900' },
          { label: 'Completed', value: stats?.completed || 0, color: 'text-green-600' },
          { label: 'Pending', value: stats?.pending || 0, color: 'text-yellow-600' },
          { label: 'Total Spent', value: `${Number(stats?.totalAmount || 0).toFixed(2)}`, color: 'text-primary-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Payment History</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.payments?.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">No payments yet</p>
            <Link href="/properties" className="text-primary-600 text-sm font-medium mt-2 inline-block hover:underline">
              Browse properties →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.payments.map((p: Record<string, unknown>) => {
                  const booking = p.booking as Record<string, unknown>;
                  const property = booking?.property as Record<string, unknown>;
                  return (
                    <tr key={p.id as number} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {property ? (
                          <Link href={`/bookings/${booking.id}`} className="text-sm font-medium text-primary-600 hover:underline">
                            {property.title as string}
                          </Link>
                        ) : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${methodBadge(p.paymentMethod as string)}`}>
                          {p.paymentMethod as string}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 tabular-nums">
                        {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.currency as string}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(p.status as string)}`}>
                          {p.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{formatDateTime(p.createdAt as string)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
