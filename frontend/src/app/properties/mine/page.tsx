'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatEth } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Home, Plus, Edit3, Trash2, Eye, ExternalLink,
  CheckCircle2, Clock, XCircle, Building2, MapPin,
} from 'lucide-react';

export default function MyPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<number | null>(null);

  if (!authLoading && !user) { router.replace('/login'); return null; }
  if (!authLoading && user && user.role !== 'OWNER') { router.replace('/dashboard'); return null; }

  const { data: properties, isLoading } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const { data } = await api.get('/properties/owner/mine');
      return data.properties as any[];
    },
    enabled: !!user && user.role === 'OWNER',
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete property');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const list = properties || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-500 mt-1">{list.length} property{list.length !== 1 ? 'ies' : 'y'} listed</p>
        </div>
        <Link
          href="/properties/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Property
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h2>
          <p className="text-sm text-gray-500 mb-6">List your first property to start earning</p>
          <Link
            href="/properties/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((property: any) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Property Info */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{property.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {property.district}</span>
                      <span>{property.bedrooms} bed</span>
                      <span>{formatEth(property.priceEth)} ETH/mo</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {/* Approval Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        property.isApproved
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {property.isApproved
                          ? <><CheckCircle2 className="w-3 h-3" /> Approved</>
                          : <><Clock className="w-3 h-3" /> Pending Approval</>
                        }
                      </span>
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        property.status === 'AVAILABLE' ? 'bg-green-50 text-green-700' :
                        property.status === 'BOOKED' ? 'bg-blue-50 text-blue-700' :
                        property.status === 'RENTED' ? 'bg-purple-50 text-purple-700' :
                        property.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {property.status}
                      </span>
                      {/* Booking count */}
                      <span className="text-xs text-gray-400">
                        {property.bookings?.length || 0} booking{(property.bookings?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/properties/${property.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    title="View public page"
                  >
                    <Eye className="w-4 h-4" /> View
                  </Link>
                  {!property.isApproved && (
                    <Link
                      href={`/properties/${property.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
                      title="Edit property"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(property.id)}
                    disabled={deleting === property.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                    title="Delete property"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === property.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
