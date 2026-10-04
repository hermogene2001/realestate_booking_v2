'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useTranslation } from '@/context/LanguageContext';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  status: string;
  publishedAt: string;
  createdAt: string;
  author: { id: number; name: string };
}

export default function BlogDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params?.slug) return;
    api.get(`/posts/${params.slug}`).then(({ data }) => {
      setPost(data);
      setLoading(false);
    }).catch((err) => {
      setError(err.response?.data?.error || 'Post not found');
      setLoading(false);
    });
  }, [params?.slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500 text-lg">{error || t('blog.post_not_found')}</p>
      <Link href="/blog" className="text-blue-600 hover:underline">{t('blog.back')}</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-8">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('blog.back')}
        </Link>

        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img src={post.coverImage} alt={post.title} className="w-full h-64 md:h-96 object-cover" />
          </div>
        )}

        <article>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
            <span>{t('blog.by')} {post.author?.name || 'Admin'}</span>
            <span>{t('blog.published')} {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}</span>
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </div>
    </div>
  );
}