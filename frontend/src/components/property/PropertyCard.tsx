'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import { formatEth, getStatusColor, parseImages } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import FairPriceBadge from '@/components/FairPriceBadge';

interface PropertyCardProps {
  property: Record<string, unknown>;
  showEditButton?: boolean;
}

export default function PropertyCard({ property, showEditButton = false }: PropertyCardProps) {
  const { t } = useTranslation();
  const images = parseImages(property.images as string | string[] | null | undefined);
  const imageUrl = images.length > 0 ? images[0] : '/images/placeholder.jpg';

  return (
    <Link href={`/properties/${property.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition group">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {images.length > 0 ? (
            <img
              src={`${API_BASE}${imageUrl}`}
              alt={property.title as string}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
          )}
          <span className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(property.status as string)}`}>
            {property.status as string}
          </span>
          {!property.isApproved && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800">
              {t('property.pending_approval')}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{property.title as string}</h3>
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.location as string}, {property.district as string}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span>{property.bedrooms as number} bed</span>
            <span>{property.bathrooms as number} bath</span>
            {(property.area as number) > 0 && <span>{property.area as number}m&sup2;</span>}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-600">
                {formatEth(property.priceEth as string)} ETH
              </span>
              <span className="text-xs text-gray-400 ml-1">{t('property.per_month')}</span>
              <FairPriceBadge
                district={property.district as string}
                bedrooms={property.bedrooms as number}
                bathrooms={property.bathrooms as number}
                area={property.area as number}
                amenities={(((property.amenities as string[]) || []))}
                actualPrice={property.priceEth as string}
              />
            </div>
            <span className="text-xs text-gray-500">
              {t('property.deposit')}: {formatEth(property.depositEth as string)} ETH
            </span>
          </div>
          {showEditButton && !property.isApproved && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href={`/properties/${property.id}/edit`}
                onClick={e => e.stopPropagation()}
                className="w-full block text-center py-1.5 px-3 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition"
              >
                ✏️ Edit & Resubmit
              </Link>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
