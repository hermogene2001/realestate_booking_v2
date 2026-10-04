'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function DisputesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['my-disputes'],
    queryFn: async () => {
      const { data } = await api.get('/bookings');
      // Filter bookings that have disputes
      return data;
    },
    enabled: !!user,
  });

  if (!user) { router.push('/login'); return null; }

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      OPEN: 'bg-amber-100 text-amber-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  const disputedBookings = data?.bookings?.filter((b: Record<string, unknown>) => b.status === 'DISPUTED') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your booking disputes</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">How to raise a dispute</h3>
        <p className="text-sm text-amber-800">
          Go to a booking detail page and click "Raise Dispute" if you have an issue with a booking.
          Our team will review and resolve it within 48 hours.
        </p>
        <Link href="/bookings" className="text-sm font-semibold text-amber-900 underline mt-2 inline-block">
          View my bookings →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">No active disputes</p>
          <p className="text-sm text-gray-400 mt-1">All your bookings are in good standing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputedBookings.map((booking: Record<string, unknown>) => {
            const property = booking.property as Record<string, unknown>;
            return (
              <div key={booking.id as number} className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/bookings/${booking.id}`}
                      className="text-base font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {property?.title as string}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{property?.location as string}</p>
                    <p className="text-xs text-gray-400 mt-1">Booking #{booking.id as number} · {formatDate(booking.createdAt as string)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor('OPEN')}`}>
                    DISPUTED
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Link href={`/bookings/${booking.id}`}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
                    View Booking
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
