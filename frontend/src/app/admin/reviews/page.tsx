'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/reviews?page=${page}&limit=20`);
      return data;
    },
    enabled: user?.role === 'ADMIN',
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch { toast.error('Failed to delete review'); }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));

  return (
    <div className="space-y-6">
      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left admin-table-header">Reviewer</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Property</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Rating</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Comment</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Owner Reply</th>
                  <th className="px-6 py-3.5 text-left admin-table-header">Date</th>
                  <th className="px-6 py-3.5 text-right admin-table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.reviews?.map((r: Record<string, unknown>) => {
                  const reviewer = r.user as Record<string, string>;
                  const property = r.property as Record<string, unknown>;
                  return (
                    <tr key={r.id as number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {reviewer?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{reviewer?.name}</p>
                            <p className="text-xs text-slate-400">{reviewer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700 max-w-[160px] truncate">
                        {property?.title as string}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-0.5">{stars(r.rating as number)}</div>
                        <span className="text-xs text-slate-400 mt-0.5">{r.rating as number}/5</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 max-w-[220px]">
                        <p className="line-clamp-2">{r.comment as string}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        {r.ownerReply ? (
                          <p className="text-xs text-slate-500 italic line-clamp-2 max-w-[160px]">"{r.ownerReply as string}"</p>
                        ) : (
                          <span className="text-xs text-slate-300">No reply</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400">{formatDate(r.createdAt as string)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(r.id as number)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(!data?.reviews || data.reviews.length === 0) && (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">No reviews yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPages} · {data?.total || 0} total</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-btn-ghost text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
