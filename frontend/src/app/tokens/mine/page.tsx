'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';
import Link from 'next/link';

function formatEth(wei: string) {
  const val = parseFloat(wei) / 1e18;
  return val.toFixed(6);
}

export default function MySharesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['my-shares'],
    queryFn: async () => {
      const { data } = await api.get('/tokens/mine');
      return data as { shares: Array<Record<string, unknown>>; owned: Array<Record<string, unknown>> };
    },
  });

  if (!user) return <div className="p-8 text-center text-gray-500">{t('profile.please_login')}</div>;
  if (isLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  const owned = data?.owned || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('token.title')}</h1>

      {user.role === 'OWNER' && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">{t('token.your_properties')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('token.mint_shares_desc')}</p>
          <Link href="/properties/mine" className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
            {t('token.manage_properties')}
          </Link>
        </div>
      )}

      {owned.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border">
          <div className="text-4xl mb-3">🏠</div>
          <h2 className="text-lg font-semibold mb-1">{t('token.no_shares')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('token.no_shares_desc')}</p>
          <Link href="/properties" className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition">
            {t('token.browse_properties')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {owned.map((share: Record<string, unknown>) => {
            const prop = (share.propertyShare as Record<string, unknown>)?.property as Record<string, unknown>;
            const ps = share.propertyShare as Record<string, unknown>;
            const images = (prop?.images as string[]) || [];
            return (
              <div key={share.id as number} className="bg-white rounded-2xl border p-4 flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                  {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{prop?.title as string}</h3>
                  <p className="text-xs text-gray-500">{prop?.location as string}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span><strong>{t('token.shares')}:</strong> {share.shareCount as number}</span>
                    <span><strong>{t('token.paid')}:</strong> {formatEth(share.totalPrice as string)} ETH</span>
                  </div>
                  <Link href={`/properties/${prop?.id}`} className="text-xs text-primary-600 mt-1 inline-block hover:underline">
                    {t('token.view_property')}
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
