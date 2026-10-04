'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

const DISTRICTS = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
const AMENITIES = ['wifi', 'parking', 'pool', 'gym', 'security', 'garden', 'balcony', 'furnished', 'air_conditioning', 'water_heater', 'generator', 'cctv', 'laundry'];

export default function CreatePropertyPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [prediction, setPrediction] = useState<Record<string, unknown> | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    district: 'Gasabo',
    lat: '-1.9403',
    lng: '29.8739',
    priceEth: '',
    depositEth: '',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
    amenities: [] as string[],
  });

  if (!authLoading && !user) {
    router.replace('/login');
    return null;
  }
  if (!authLoading && user && user.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  const update = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const fetchPrediction = useCallback(async () => {
    if (!formData.district || !formData.bedrooms || !formData.bathrooms || !formData.area) return;
    setPredicting(true);
    try {
      const { data } = await api.post('/ai/predict-price', {
        district: formData.district,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        amenities: formData.amenities,
      });
      if (data.success) {
        setPrediction(data.prediction);
        setShowSuggestion(true);
      }
    } catch {
      // silently fail
    } finally {
      setPredicting(false);
    }
  }, [formData.district, formData.bedrooms, formData.bathrooms, formData.area, formData.amenities]);

  const applySuggestedPrice = (price: string) => {
    update('priceEth', price);
    setShowSuggestion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'amenities') {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, value as string);
        }
      });
      images.forEach(img => fd.append('images', img));

      await api.post('/properties', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Property created! Waiting for admin approval.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('property.add_property')}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.title')}</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => update('title', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="Modern 2-bedroom apartment in Kicukiro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.description')}</label>
          <textarea
            value={formData.description}
            onChange={e => update('description', e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => update('location', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="KG 123 Street"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.district')}</label>
            <select
              value={formData.district}
              onChange={e => update('district', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Price Fields with AI Suggestion */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.price_eth')}</label>
            <div className="relative">
              <input
                type="text"
                value={formData.priceEth}
                onChange={e => update('priceEth', e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="0.5"
              />
              {predicting && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 animate-pulse">AI suggesting...</span>
              )}
              {!predicting && !formData.priceEth && (
                <button
                  type="button"
                  onClick={fetchPrediction}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded-lg"
                >
                  AI Suggest
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.deposit_eth')}</label>
            <input
              type="text"
              value={formData.depositEth}
              onChange={e => update('depositEth', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="0.2"
            />
          </div>
        </div>

        {/* Price Suggestion Card */}
        {showSuggestion && prediction && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-800 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  AI Price Suggestion
                </p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{parseFloat(prediction.predictedPriceEth as string).toFixed(4)} ETH <span className="text-sm font-normal text-gray-500">/month</span></p>
                {prediction.confidence !== undefined && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (prediction.confidence as number) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{((prediction.confidence as number) * 100).toFixed(0)}%</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Based on {prediction.comparableCount as number || 0} similar properties in {formData.district}
                </p>
              </div>
              <button
                type="button"
                onClick={() => applySuggestedPrice((prediction.predictedPriceEth as number).toFixed(4))}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition shrink-0"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.bedrooms')}</label>
            <input type="number" value={formData.bedrooms} onChange={e => { update('bedrooms', e.target.value); setShowSuggestion(false); }} min="1" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.bathrooms')}</label>
            <input type="number" value={formData.bathrooms} onChange={e => { update('bathrooms', e.target.value); setShowSuggestion(false); }} min="1" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.area')}</label>
            <input type="number" value={formData.area} onChange={e => { update('area', e.target.value); setShowSuggestion(false); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="80" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Location on Map</label>
          <LocationPicker
            lat={parseFloat(formData.lat)}
            lng={parseFloat(formData.lng)}
            onChange={(lat, lng) => {
              update('lat', lat.toString());
              update('lng', lng.toString());
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('property.images')}</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={e => setImages(Array.from(e.target.files || []))}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-gray-400 mt-1">Max 5 images, 5MB each. JPEG, PNG, or WebP.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('property.amenities')}</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                  formData.amenities.includes(a)
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {a.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('property.create_btn')}
        </button>
      </form>
    </div>
  );
}
