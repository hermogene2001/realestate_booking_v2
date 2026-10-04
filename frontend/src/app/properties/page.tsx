'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';
import PropertyCard from '@/components/property/PropertyCard';

const DISTRICTS = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
const STATUS_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Rented', value: 'RENTED' },
];

export default function PropertiesPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    district: '',
    bedrooms: '',
    search: '',
    status: 'AVAILABLE' as string,
    page: 1,
  });

  const queryString = Object.entries(filters)
    .filter(([, v]) => v !== '' && v !== 0)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const { data, isLoading } = useQuery({
    queryKey: ['properties', queryString],
    queryFn: async () => {
      const { data } = await api.get(`/properties?${queryString}&limit=12`);
      return data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('property.browse_title')}</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilters(f => ({ ...f, status: tab.value, page: 1 }))}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
              filters.status === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.search')}</label>
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              placeholder={t('property.search_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.district')}</label>
            <select
              value={filters.district}
              onChange={e => setFilters(f => ({ ...f, district: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">{t('property.all_districts')}</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.bedrooms')}</label>
            <select
              value={filters.bedrooms}
              onChange={e => setFilters(f => ({ ...f, bedrooms: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ district: '', bedrooms: '', search: '', status: 'AVAILABLE', page: 1 })}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              {t('property.clear_filters')}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">{t('common.loading')}</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.properties?.map((property: Record<string, unknown>) => (
              <PropertyCard key={property.id as number} property={property} />
            ))}
          </div>

          {!data?.properties?.length && (
            <div className="text-center py-20">
              <p className="text-gray-500">{t('property.no_results')}</p>
            </div>
          )}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    filters.page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
