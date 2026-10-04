'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import api, { API_BASE } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { formatEth, formatDate, getStatusColor, parseImages, parseAmenities } from '@/lib/utils';
import toast from 'react-hot-toast';

const PropertyMap = dynamic(() => import('@/components/PropertyMap'), { ssr: false });
const SharesSection = dynamic(() => import('@/components/SharesSection'), { ssr: false });
const MarketPriceSection = dynamic(() => import('@/components/MarketPriceSection'), { ssr: false });

// ── Owner reply sub-component ──────────────────────────────────────────────
function ReviewItem({ review, isOwner }: { review: Record<string, unknown>; isOwner: boolean; propertyOwnerId?: number }) {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/reviews/${review.id}/reply`, { ownerReply: replyText.trim() });
      toast.success('Reply posted');
      setShowReply(false);
      queryClient.invalidateQueries({ queryKey: ['property', id] });
    } catch { toast.error('Failed to post reply'); }
    finally { setSaving(false); }
  };

  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
            {(review.user as Record<string, string>)?.name?.charAt(0)}
          </div>
          <span className="font-medium text-gray-900">{(review.user as Record<string, string>)?.name}</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < (review.rating as number) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-400">{formatDate(review.createdAt as string)}</span>
      </div>
      <p className="text-gray-600 text-sm">{review.comment as string}</p>

      {/* Owner reply */}
      {review.ownerReply ? (
        <div className="mt-3 pl-4 border-l-2 border-primary-200 bg-primary-50/50 rounded-r-lg py-2 pr-3">
          <p className="text-xs font-semibold text-primary-700 mb-0.5">Owner reply</p>
          <p className="text-sm text-gray-600">{review.ownerReply as string}</p>
        </div>
      ) : isOwner ? (
        <div className="mt-2">
          {!showReply ? (
            <button onClick={() => setShowReply(true)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              + Reply to this review
            </button>
          ) : (
            <div className="mt-2 space-y-2">
              <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Write your reply..." />
              <div className="flex gap-2">
                <button onClick={submitReply} disabled={saving || !replyText.trim()}
                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Posting...' : 'Post Reply'}
                </button>
                <button onClick={() => { setShowReply(false); setReplyText(''); }}
                  className="px-3 py-1.5 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });
  const [booking, setBooking] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data } = await api.get(`/properties/${id}`);
      return data.property;
    },
  });

  const { data: priceData } = useQuery({
    queryKey: ['eth-price'],
    queryFn: async () => {
      const { data } = await api.get('/price/eth');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!bookingDates.startDate || !bookingDates.endDate) {
      toast.error('Please select dates');
      return;
    }
    setBooking(true);
    try {
      const { data: result } = await api.post('/bookings', {
        propertyId: parseInt(id as string),
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate,
      });
      toast.success('Booking created! Proceed to deposit.');
      router.push(`/bookings/${result.booking.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (!data) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">Property not found</div>;

  const images = parseImages(data.images);
  const amenities = parseAmenities(data.amenities);
  const ethUsd = priceData?.eth_usd || 0;
  const ethRwf = priceData?.eth_rwf || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="relative rounded-2xl overflow-hidden bg-gray-200 h-80 lg:h-96">
          {images.length > 0 ? (
            <img
              src={`${API_BASE}${images[currentImage]}`}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-lg">No Images</span>
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${i === currentImage ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(data.status)}`}>
              {data.status}
            </span>
            {!data.isApproved && (
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
                {t('property.pending_approval')}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.title}</h1>
          <p className="text-gray-500 mb-4 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {data.location}, {data.district}
          </p>

          {/* Price */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {formatEth(data.priceEth)} ETH
              <span className="text-sm text-gray-400 font-normal ml-2">{t('property.per_month')}</span>
            </div>
            {ethUsd > 0 && (
              <div className="text-sm text-gray-500">
                ≈ ${(parseFloat(data.priceEth) * ethUsd).toLocaleString()} USD
                {' / '}
                {(parseFloat(data.priceEth) * ethRwf).toLocaleString()} RWF
              </div>
            )}
            <div className="mt-2 text-sm text-gray-600">
              {t('property.deposit')}: <span className="font-semibold">{formatEth(data.depositEth)} ETH</span>
              {ethUsd > 0 && (
                <span className="text-gray-400 ml-1">
                  (≈ ${(parseFloat(data.depositEth) * ethUsd).toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Booking Form */}
          {data.status === 'AVAILABLE' && data.isApproved && user?.role === 'TENANT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('booking.start_date')}</label>
                  <input
                    type="date"
                    value={bookingDates.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingDates(d => ({ ...d, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('booking.end_date')}</label>
                  <input
                    type="date"
                    value={bookingDates.endDate}
                    min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setBookingDates(d => ({ ...d, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleBooking}
                disabled={booking}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                {booking ? t('common.loading') : t('property.book_now')}
              </button>
            </div>
          )}

          {!user && data.status === 'AVAILABLE' && (
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
            >
              {t('nav.login')} to {t('property.book_now')}
            </button>
          )}

          {/* Owner Info */}
          {data.owner && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-1">Listed by</p>
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{data.owner.name}</p>
                {user && user.id === data.owner.id ? (
                  <Link
                    href={`/properties/${data.id}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Property
                  </Link>
                ) : user && user.id !== data.owner.id ? (
                  <a
                    href={`/messages?userId=${data.owner.id}&propertyId=${data.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Message
                  </a>
                ) : null}
                {!user && (
                  <a
                    href="/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Message Owner
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Details */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-4">{t('property.details')}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{data.bedrooms}</div>
                <div className="text-sm text-gray-500">{t('property.bedrooms')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{data.bathrooms}</div>
                <div className="text-sm text-gray-500">{t('property.bathrooms')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{data.area}</div>
                <div className="text-sm text-gray-500">m&sup2;</div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-semibold mb-4">{t('property.amenities')}</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a: string) => (
                  <span key={a} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 capitalize">
                    {a.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Market Price Analysis */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Market Price Analysis</h2>
            <MarketPriceSection
              district={data.district}
              bedrooms={data.bedrooms}
              bathrooms={data.bathrooms}
              area={data.area}
              amenities={parseAmenities(data.amenities)}
              actualPrice={data.priceEth}
            />
          </div>

          {/* Fractional Shares */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Fractional Ownership</h2>
            <p className="text-sm text-gray-500 mb-4">
              Own a piece of this property by buying fractional shares. Earn proportional rental income when the property is booked.
            </p>
            <SharesSection propertyId={data.id} ownerId={data.owner?.id} currentUserId={user?.id} />
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-semibold mb-4">{t('property.reviews')}</h2>
            {data.reviews?.length > 0 ? (
              <div className="space-y-4">
                {data.reviews.map((review: Record<string, unknown>) => {
                  const isMyProperty = user?.id === data.owner?.id;
                  return (
                    <ReviewItem
                      key={review.id as number}
                      review={review}
                      isOwner={isMyProperty}
                      propertyOwnerId={data.owner?.id}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('review.no_reviews')}</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-2xl border p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">{t('property.location')}</h3>
            <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center text-gray-400 text-sm">
              <PropertyMap lat={data.lat} lng={data.lng} title={data.title} />
            </div>
            <p className="text-sm text-gray-600 mt-3">{data.location}, {data.district}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
