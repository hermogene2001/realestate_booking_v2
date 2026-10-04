'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import api, { API_BASE } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Favorite {
  id: number;
  property: {
    id: number;
    title: string;
    description: string;
    priceEth: number;
    images: string[];
    district: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    isApproved: boolean;
    owner: {
      id: number;
      name: string;
      isVerified: boolean;
    };
  };
  createdAt: string;
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, page]);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get(`/wishlist?page=${page}&limit=12`);
      setFavorites(data.favorites);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (propertyId: number) => {
    try {
      await api.delete(`/wishlist/${propertyId}`);
      setFavorites(favorites.filter(f => f.property.id !== propertyId));
      setTotal(total - 1);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (!user) {
    return null; // redirecting
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('wishlist.title')}</h1>
        <p className="text-gray-600">
          {total} {total === 1 ? t('wishlist.property') : t('wishlist.properties')} {t('wishlist.saved')}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border animate-pulse h-80"></div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('wishlist.empty')}</h2>
          <p className="text-gray-600 mb-6">{t('wishlist.empty_hint')}</p>
          <Link
            href="/properties"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
          >
            {t('wishlist.browse')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                <Link href={`/properties/${fav.property.id}`}>
                  <div className="relative h-48 bg-gray-100">
                    {fav.property.images?.[0] ? (
                      <img
                        src={`${API_BASE}${fav.property.images[0]}`}
                        alt={fav.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{t('wishlist.no_image')}</div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(fav.property.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition"
                    >
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/properties/${fav.property.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-primary-600">
                      {fav.property.title}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 mb-2">
                    {fav.property.district}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{fav.property.bedrooms} beds</span>
                    <span>{fav.property.bathrooms} baths</span>
                    <span>{fav.property.propertyType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary-600">
                      {fav.property.priceEth} ETH
                    </p>
                    {fav.property.owner.isVerified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {t('wishlist.verified_owner')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                {t('common.pagination_previous')}
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 border rounded-lg ${
                    page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                {t('common.pagination_next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
