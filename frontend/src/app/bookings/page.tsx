'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { formatEth, formatDate, getStatusColor } from '@/lib/utils';

export default function BookingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings');
      return data.bookings;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Please login to view your bookings</p>
        <Link href="/login" className="text-primary-600 font-medium">{t('nav.login')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('booking.title')}</h1>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : !data?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">{t('booking.no_bookings')}</p>
          <Link href="/properties" className="inline-block mt-4 text-primary-600 font-medium">
            {t('home.browse')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((booking: Record<string, unknown>) => {
            const property = booking.property as Record<string, unknown>;
            const tenant = booking.tenant as Record<string, unknown> | undefined;
            const owner = property?.owner as Record<string, unknown> | undefined;

            return (
              <Link key={booking.id as number} href={`/bookings/${booking.id}`}>
                <div className="bg-white rounded-2xl border p-6 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {property?.title as string || `Booking #${booking.id}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(booking.status as string)}`}>
                          {t(`booking.${(booking.status as string).toLowerCase()}` as 'booking.pending')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {property?.location as string}
                        {tenant && <span className="ml-2">| Tenant: {tenant.name as string}</span>}
                        {owner && <span className="ml-2">| Owner: {owner.name as string}</span>}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{formatDate(booking.startDate as string)} - {formatDate(booking.endDate as string)}</span>
                        {booking.escrowAmount ? (
                          <span className="font-medium text-primary-600">
                            {formatEth(booking.escrowAmount as string)} ETH
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {Boolean(booking.tenantConfirmed) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                          {t('booking.tenant_confirmed')}
                        </span>
                      )}
                      {Boolean(booking.ownerConfirmed) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                          {t('booking.owner_confirmed')}
                        </span>
                      )}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
