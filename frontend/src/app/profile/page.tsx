'use client';

import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useTranslation } from '@/context/LanguageContext';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { shortenAddress } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { address, connect } = useWallet();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [saving, setSaving] = useState(false);
  const [manualWalletAddress, setManualWalletAddress] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<{ walletAddress: string; privateKey: string } | null>(null);
  const [showGeneratedWallet, setShowGeneratedWallet] = useState(false);

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">{t('profile.please_login')}</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone, language } as Record<string, unknown> & Partial<typeof user>);
      toast.success(t('common.save'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWallet = async () => {
    try {
      if (!address) {
        await connect();
        return;
      }
      await api.patch('/auth/wallet', { walletAddress: address });
      await refreshUser();
      toast.success(t('profile.wallet_linked'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMsg = error.response?.data?.error || (err instanceof Error ? err.message : t('profile.failed_to_link_wallet'));
      console.error('Wallet link error:', err);
      toast.error(errorMsg);
    }
  };

  const handleGenerateWallet = async () => {
    try {
      const { data } = await api.post('/auth/wallet/generate');
      setGeneratedWallet({ walletAddress: data.walletAddress, privateKey: data.privateKey });
      setShowGeneratedWallet(true);
      await refreshUser();
      toast.success(t('profile.wallet_generated'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || t('profile.failed_to_generate_wallet'));
    }
  };

  const handleLinkManualWallet = async () => {
    if (!manualWalletAddress.trim()) {
      toast.error(t('profile.enter_address_error'));
      return;
    }
    try {
      await api.patch('/auth/wallet', { walletAddress: manualWalletAddress.trim() });
      await refreshUser();
      setManualWalletAddress('');
      setShowManualEntry(false);
      toast.success(t('profile.wallet_linked'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || t('profile.failed_to_link_wallet'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('nav.profile')}</h1>

      <div className="bg-white rounded-2xl border p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-2xl">{user.name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500">{user.email} | {user.role}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.language')}</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            <option value="fr">Fran&ccedil;ais</option>
            <option value="sw">Kiswahili</option>
          </select>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
          {saving ? t('common.loading') : t('common.save')}
        </button>

        {/* Wallet Section */}
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">{t('profile.wallet')}</h3>
          {user.walletAddress ? (
            <div className="flex items-center gap-3">
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-mono">
                {shortenAddress(user.walletAddress)}
              </span>
              <span className="text-xs text-gray-500">{t('profile.linked')}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: Connect MetaMask */}
              {address ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{shortenAddress(address)}</span>
                  <button onClick={handleLinkWallet} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700">
                    {t('profile.link_this_wallet')}
                  </button>
                </div>
              ) : (
                <button onClick={connect} className="w-full px-4 py-2 bg-primary-50 text-primary-700 text-sm rounded-xl font-medium hover:bg-primary-100">
                  {t('profile.connect_metamask')}
                </button>
              )}

              {/* Option 2: Generate New Wallet */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">{t('profile.or')}</span>
                </div>
              </div>

              <button 
                onClick={handleGenerateWallet} 
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-xl font-medium hover:bg-blue-100"
              >
                {t('profile.generate_wallet')}
              </button>

              {/* Option 3: Manual Entry */}
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="w-full px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-100"
              >
                {showManualEntry ? t('common.cancel') : t('profile.enter_address')}
              </button>

              {showManualEntry && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={manualWalletAddress}
                    onChange={(e) => setManualWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleLinkManualWallet}
                    className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700"
                  >
                    {t('profile.link_wallet')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show Generated Wallet Info */}
          {showGeneratedWallet && generatedWallet && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ {t('profile.save_private_key')}</p>
              <p className="text-xs text-yellow-700 mb-2">{t('profile.private_key_warning')}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('profile.wallet_address')}:</p>
                  <p className="text-xs font-mono bg-white px-3 py-2 rounded border break-all">{generatedWallet.walletAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">{t('profile.private_key')}:</p>
                  <p className="text-xs font-mono bg-white px-3 py-2 rounded border break-all">{generatedWallet.privateKey}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGeneratedWallet(false)}
                className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white text-sm rounded-xl hover:bg-yellow-700"
              >
                {t('profile.saved_private_key')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
