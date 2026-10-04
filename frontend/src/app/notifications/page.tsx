'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  BOOKING_CREATED:    { icon: '📅', color: 'bg-blue-50 border-blue-100' },
  DEPOSIT_CONFIRMED:  { icon: '💰', color: 'bg-emerald-50 border-emerald-100' },
  HANDOVER_PENDING:   { icon: '🔑', color: 'bg-amber-50 border-amber-100' },
  FUNDS_RELEASED:     { icon: '✅', color: 'bg-emerald-50 border-emerald-100' },
  REFUND_ISSUED:      { icon: '↩️', color: 'bg-violet-50 border-violet-100' },
  REVIEW_RECEIVED:    { icon: '⭐', color: 'bg-yellow-50 border-yellow-100' },
  PROPERTY_APPROVED:  { icon: '🏠', color: 'bg-green-50 border-green-100' },
  PROPERTY_REJECTED:  { icon: '❌', color: 'bg-rose-50 border-rose-100' },
  FRAUD_ALERT:        { icon: '🚨', color: 'bg-rose-50 border-rose-100' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (unreadOnly) params.set('unread', 'true');
      const { data } = await api.get(`/notifications?${params}`);
      return data;
    },
    enabled: !!user,
  });

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch { toast.error('Failed'); }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;
  const unreadCount = data?.notifications?.filter((n: Record<string, unknown>) => !n.isRead).length || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-0.5">{unreadCount} {t('notifications.unread')}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${unreadOnly ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {unreadOnly ? t('notifications.show_all') : t('notifications.unread_only')}
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
              {t('notifications.mark_all_read')}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.notifications?.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">{t('notifications.no_notifications')}</p>
          <p className="text-sm text-gray-400 mt-1">{unreadOnly ? t('notifications.no_unread') : t('notifications.all_caught_up')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.notifications.map((n: Record<string, unknown>) => {
            const typeInfo = TYPE_ICONS[n.type as string] || { icon: '🔔', color: 'bg-gray-50 border-gray-100' };
            return (
              <div key={n.id as number}
                onClick={() => { if (!n.isRead) markRead(n.id as number); }}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${typeInfo.color} ${!n.isRead ? 'ring-1 ring-primary-200' : 'opacity-75'}`}>
                <span className="text-2xl shrink-0">{typeInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.message as string}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt as string)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            {t('common.pagination_previous')}
          </button>
          <span className="text-sm text-gray-500">{t('common.pagination_page')} {page} {t('common.pagination_of')} {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            {t('common.pagination_next')}
          </button>
        </div>
      )}
    </div>
  );
}
