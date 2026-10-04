'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useTranslation } from '@/context/LanguageContext';
import { shortenAddress } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'rw', label: 'RW' },
  { code: 'fr', label: 'FR' },
  { code: 'sw', label: 'SW' },
  { code: 'ar', label: 'AR' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { address, connect, isConnecting, isCorrectNetwork, switchNetwork } = useWallet();
  const { locale, setLocale, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KR</span>
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Kigali RE</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/properties" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
              {t('nav.properties')}
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
              {t('nav.blog')}
            </Link>
            {user && (
              <Link href="/bookings" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.bookings')}
              </Link>
            )}
            {user && (
              <Link href="/messages" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.messages')}
              </Link>
            )}
            {user && (
              <Link href="/rewards" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.rewards')}
              </Link>
            )}
            {user && (
              <Link href="/tokens/mine" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.shares')}
              </Link>
            )}
            {user && (
              <Link href="/agent" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.agent')}
              </Link>
            )}
            {user && (
              <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.dashboard')}
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition">
                {t('nav.admin')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition ${
                    locale === lang.code
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Wallet */}
            {address ? (
              <div className="flex items-center gap-2">
                {!isCorrectNetwork && (
                  <button
                    onClick={switchNetwork}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md font-medium"
                  >
                    {t('wallet.switch_network')}
                  </button>
                )}
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {shortenAddress(address)}
                </span>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-medium hover:bg-primary-100 transition"
              >
                {isConnecting ? '...' : t('wallet.connect')}
              </button>
            )}

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      {t('nav.profile')}
                    </Link>
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      {t('nav.dashboard')}
                    </Link>
                    <Link href="/tokens/mine" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      {t('nav.shares')}
                    </Link>
                    <Link href="/insurance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      {t('nav.insurance')}
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="text-sm bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 font-medium transition">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t space-y-1">
            <Link href="/properties" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.properties')}</Link>
            <Link href="/blog" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.blog')}</Link>
            {user && <Link href="/bookings" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.bookings')}</Link>}
            {user && <Link href="/messages" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.messages')}</Link>}
            {user && <Link href="/rewards" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.rewards')}</Link>}
            {user && <Link href="/tokens/mine" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.shares')}</Link>}
            {user && <Link href="/agent" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.agent')}</Link>}
            {user && <Link href="/dashboard" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.dashboard')}</Link>}
            {user?.role === 'ADMIN' && <Link href="/admin" className="block py-2 px-2 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{t('nav.admin')}</Link>}
          </div>
        )}
      </div>
    </nav>
  );
}
