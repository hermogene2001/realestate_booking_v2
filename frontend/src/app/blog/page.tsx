'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  status: string;
  publishedAt: string;
  createdAt: string;
  author: { id: number; name: string };
}

export default function BlogPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts').then(({ data }) => {
      setPosts(data.posts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800">{t('blog.title')}</h1>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">{t('blog.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">{t('blog.no_posts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {post.coverImage ? (
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : t('blog.draft')}</p>
                  <h3 className="text-lg font-semibold text-slate-800 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-3">{post.excerpt}</p>}
                  <p className="text-xs text-slate-400 mt-4">{t('blog.by')} {post.author?.name || 'Admin'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
