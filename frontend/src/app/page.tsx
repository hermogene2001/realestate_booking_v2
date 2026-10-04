'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import PropertyCard from '@/components/property/PropertyCard';

export default function HomePage() {
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data } = await api.get('/properties?limit=6');
      return data;
    },
  });

  const steps = [
    { icon: '1', title: t('home.step1_title'), desc: t('home.step1_desc') },
    { icon: '2', title: t('home.step2_title'), desc: t('home.step2_desc') },
    { icon: '3', title: t('home.step3_title'), desc: t('home.step3_desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
              {t('home.title')}
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 leading-relaxed">
              {t('home.subtitle')}
            </p>
            <p className="text-primary-200 mb-10 max-w-2xl">
              {t('home.description')}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/properties"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition shadow-lg"
              >
                {t('home.browse')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition"
              >
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">3</div>
              <div className="text-sm text-gray-500">{t('stats.districts')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">100%</div>
              <div className="text-sm text-gray-500">{t('stats.secure_escrow')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">0%</div>
              <div className="text-sm text-gray-500">{t('stats.deposit_fraud')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">4</div>
              <div className="text-sm text-gray-500">{t('stats.languages')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {t('home.how_title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-md transition">
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-600">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">{t('home.featured')}</h2>
            <Link href="/properties" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All &rarr;
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.properties?.map((property: Record<string, unknown>) => (
              <PropertyCard key={property.id as number} property={property} />
            ))}
            {!data?.properties?.length && (
              <p className="text-gray-500 col-span-full text-center py-12">
                {t('property.no_results')}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
