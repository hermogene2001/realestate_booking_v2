'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Verification {
  id: number;
  userId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  idDocFront: string;
  idDocBack: string;
  selfie: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    walletAddress: string | null;
  };
}

export default function AdminKYCPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchVerifications();
  }, [user, router, filter]);

  const fetchVerifications = async () => {
    try {
      const { data } = await api.get(`/kyc/all?status=${filter}`);
      setVerifications(data.verifications);
    } catch (error) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/kyc/${selectedVerification!.id}/review`, {
        decision,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
      });
      toast.success(`Verification ${decision.toLowerCase()} successfully`);
      setSelectedVerification(null);
      setRejectionReason('');
      fetchVerifications();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Review failed');
    } finally {
      setProcessing(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification Review</h1>
        <p className="text-gray-600">Review and approve user identity verifications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
            {status === 'PENDING' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {verifications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <p className="text-gray-500">No {filter.toLowerCase()} verifications</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white rounded-xl border p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedVerification(verification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{verification.user.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      verification.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : verification.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {verification.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{verification.user.email}</p>
                  <p className="text-sm text-gray-600">{verification.user.phone}</p>
                  {verification.user.walletAddress && (
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      Wallet: {verification.user.walletAddress.slice(0, 6)}...{verification.user.walletAddress.slice(-4)}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Submitted {new Date(verification.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review Verification</h2>
              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedVerification.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedVerification.user.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedVerification.user.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedVerification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Identity Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">ID Front</p>
                    <img
                      src={selectedVerification.idDocFront}
                      alt="ID Front"
                      className="rounded-lg border w-full"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">ID Back</p>
                    <img
                      src={selectedVerification.idDocBack}
                      alt="ID Back"
                      className="rounded-lg border w-full"
                    />
                  </div>
                </div>
                {selectedVerification.selfie && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Selfie with ID</p>
                    <img
                      src={selectedVerification.selfie}
                      alt="Selfie"
                      className="rounded-lg border max-h-64"
                    />
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Provide a reason for rejection..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={processing}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
