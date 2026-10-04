'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TwoFASetupPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    check2FAStatus();
  }, [user, router]);

  const check2FAStatus = async () => {
    try {
      const { data } = await api.get('/2fa/status');
      setIsEnabled(data.enabled);
    } catch (error) {
      // 2FA not set up
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/2fa/setup');
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/2fa/verify-setup', { token: verificationCode });
      setIsEnabled(true);
      await refreshUser();
      toast.success('2FA enabled successfully!');
      setStep(4);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!verificationCode) {
      toast.error('Please enter verification code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/2fa/disable', { token: verificationCode });
      setIsEnabled(false);
      await refreshUser();
      toast.success('2FA disabled');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to disable');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
        <p className="text-gray-600 mb-8">
          Add an extra layer of security to your account
        </p>

        {isEnabled ? (
          // 2FA Already Enabled
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">2FA Enabled</h2>
              <p className="text-green-700">Your account is protected with two-factor authentication</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Disable 2FA</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        ) : step === 1 ? (
          // Step 1: Introduction
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">What is Two-Factor Authentication?</h3>
              <p className="text-sm text-blue-800 mb-3">
                2FA adds an extra layer of security by requiring a code from your authenticator app in addition to your password.
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>✓ Scan the QR code we'll provide</li>
                <li>✓ Enter the 6-digit code to verify</li>
                <li>✓ Save your backup codes in a secure location</li>
              </ul>
            </div>

            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        ) : step === 2 ? (
          // Step 2: Scan QR Code
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
              <div className="bg-white p-4 inline-block rounded-xl border mb-4">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-600 mb-2">Scan this QR code with your authenticator app</p>
              <p className="text-xs text-gray-500 mb-4">Or manually enter this secret:</p>
              <code className="block bg-gray-100 px-4 py-2 rounded-lg text-sm font-mono">{secret}</code>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
            >
              I've Scanned the Code
            </button>
          </div>
        ) : step === 3 ? (
          // Step 3: Verify Code
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        ) : (
          // Step 4: Backup Codes
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Save Your Backup Codes</h3>
              <p className="text-sm text-yellow-800 mb-4">
                These backup codes can be used if you lose access to your authenticator app. Store them securely!
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <code key={index} className="bg-white px-3 py-2 rounded border text-sm font-mono text-center">
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'));
                  toast.success('Codes copied to clipboard');
                }}
                className="w-full py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
              >
                Copy All Codes
              </button>
            </div>

            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
