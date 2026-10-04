'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface BlogPost {
  id: number; title: string; slug: string; excerpt: string;
  coverImage: string | null; status: string; publishedAt: string;
  createdAt: string; author?: { id: number; name: string };
}

export default function AdminBlogPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Partial<BlogPost> & { content?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog', page],
    queryFn: async () => { const { data } = await api.get(`/posts?page=${page}&limit=10`); return data; },
  });

  const posts: BlogPost[] = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/posts', body),
    onSuccess: () => { toast.success('Post created'); setEditing(null); queryClient.invalidateQueries({ queryKey: ['admin-blog'] }); },
    onError: () => toast.error('Failed to create post'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, excerpt, content, coverImage }: Record<string, unknown>) =>
      api.put(`/posts/${id}`, { title, excerpt, content, coverImage }),
    onSuccess: () => { toast.success('Post updated'); setEditing(null); queryClient.invalidateQueries({ queryKey: ['admin-blog'] }); },
    onError: () => toast.error('Failed to update post'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => api.post(`/posts/${id}/publish`),
    onSuccess: () => { toast.success('Post published'); queryClient.invalidateQueries({ queryKey: ['admin-blog'] }); },
    onError: () => toast.error('Failed to publish post'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/posts/${id}`),
    onSuccess: () => { toast.success('Post deleted'); queryClient.invalidateQueries({ queryKey: ['admin-blog'] }); },
    onError: () => toast.error('Failed to delete post'),
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (editing.id) {
      updateMutation.mutate(editing as Record<string, unknown>);
    } else {
      createMutation.mutate(editing as Record<string, unknown>);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <p className="text-slate-500 mt-1">Create and manage blog posts</p>
        </div>
        <button onClick={() => setEditing({ title: '', excerpt: '', content: '', coverImage: '' })} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">New Post</button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">{editing.id ? 'Edit Post' : 'Create Post'}</h3>
          <input type="text" placeholder="Title *" value={editing.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <textarea placeholder="Excerpt (short summary)" value={editing.excerpt || ''} onChange={e => setEditing(p => ({ ...p, excerpt: e.target.value }))} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <textarea placeholder="Content (markdown or plain text) *" value={editing.content || ''} onChange={e => setEditing(p => ({ ...p, content: e.target.value }))} required rows={8} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
          <input type="text" placeholder="Cover Image URL (optional)" value={editing.coverImage || ''} onChange={e => setEditing(p => ({ ...p, coverImage: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <div className="flex gap-3">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEditing(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <p className="text-slate-400">No blog posts yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Author</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200">
              {posts.map((post: BlogPost) => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{post.title}</p>
                    <p className="text-xs text-slate-400">/{post.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{post.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{post.author?.name || 'Admin'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(post)} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Edit</button>
                      {post.status !== 'PUBLISHED' && (
                        <button onClick={() => publishMutation.mutate(post.id)} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">Publish</button>
                      )}
                      <button onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(post.id); }} className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-3 border-t border-slate-200">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm text-slate-600 disabled:opacity-50">Previous</button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-sm text-slate-600 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
