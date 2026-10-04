'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const { locale, t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'TENANT' as 'TENANT' | 'OWNER',
    language: locale,
  });
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users away from register page
  if (!authLoading && user) {
    router.replace('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('auth.register_title')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => update('name', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => update('email', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => update('phone', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="+250 7XX XXX XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => update('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('auth.role')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update('role', 'TENANT')}
                className={`p-3 rounded-xl border text-sm font-medium transition ${
                  formData.role === 'TENANT'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('auth.tenant')}
              </button>
              <button
                type="button"
                onClick={() => update('role', 'OWNER')}
                className={`p-3 rounded-xl border text-sm font-medium transition ${
                  formData.role === 'OWNER'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t('auth.owner')}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          {t('auth.has_account')}{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
