'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { parseImages, parseAmenities } from '@/lib/utils';
import { API_BASE } from '@/lib/api';

const DISTRICTS = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
const AMENITIES = ['wifi', 'parking', 'pool', 'gym', 'security', 'garden', 'balcony', 'furnished', 'air_conditioning', 'water_heater', 'generator', 'cctv', 'laundry'];

export default function EditPropertyClient() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/properties/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const property = res?.property || res;
  const existingImages: string[] = property ? parseImages(property.images) : [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    district: 'Gasabo',
    priceEth: '',
    depositEth: '',
    bedrooms: '1',
    bathrooms: '1',
    area: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        district: property.district || 'Gasabo',
        priceEth: property.priceEth || '',
        depositEth: property.depositEth || '',
        bedrooms: String(property.bedrooms || '1'),
        bathrooms: String(property.bathrooms || '1'),
        area: String(property.area || ''),
        amenities: parseAmenities(property.amenities),
      });
    }
  }, [property]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !property) return <div className="min-h-screen flex items-center justify-center text-slate-500">Property not found</div>;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        district: formData.district,
        priceEth: formData.priceEth,
        depositEth: formData.depositEth,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        area: parseFloat(formData.area) || 0,
        amenities: formData.amenities,
      };
      await api.put(`/properties/${id}`, payload);
      toast.success('Property updated');
      router.push(`/properties/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Property</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => update('title', e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              value={formData.district}
              onChange={e => update('district', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETH/month)</label>
            <input
              type="text"
              value={formData.priceEth}
              onChange={e => update('priceEth', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (ETH)</label>
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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
            <input type="number" value={formData.bedrooms} onChange={e => update('bedrooms', e.target.value)} min="1" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
            <input type="number" value={formData.bathrooms} onChange={e => update('bathrooms', e.target.value)} min="1" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area (m&sup2;)</label>
            <input type="number" value={formData.area} onChange={e => update('area', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="80" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
          {existingImages.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((img, i) => (
                <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border">
                    <img
                      src={img.startsWith('http') ? img : `${API_BASE}${img}`}
                      alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No images</p>
          )}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace Images (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={e => setNewImages(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
