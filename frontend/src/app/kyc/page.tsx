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
}

export default function KYCPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [formData, setFormData] = useState({
    idDocFront: '',
    idDocBack: '',
    selfie: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    checkVerificationStatus();
  }, [user, router]);

  const checkVerificationStatus = async () => {
    try {
      const { data } = await api.get('/kyc/status');
      if (data.verification) {
        setVerification(data.verification);
      }
    } catch (error) {
      // No verification yet
    }
  };

  const handleFileUpload = async (file: File, field: 'idDocFront' | 'idDocBack' | 'selfie') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/properties/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, [field]: data.url }));
      toast.success(`${field} uploaded successfully`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!formData.idDocFront || !formData.idDocBack) {
      toast.error('Please upload both ID document images');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/kyc/submit', formData);
      setVerification(data.verification);
      toast.success('Verification submitted successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Already verified
  if (verification?.status === 'APPROVED') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Identity Verified</h1>
          <p className="text-gray-600 mb-4">
            Your identity has been successfully verified on {new Date(verification.verifiedAt!).toLocaleDateString()}.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Verified Account</span>
          </div>
        </div>
      </div>
    );
  }

  // Pending review
  if (verification?.status === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Under Review</h1>
          <p className="text-gray-600">
            Your identity verification is being reviewed. This usually takes 24-48 hours.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-medium">Pending Review</span>
          </div>
        </div>
      </div>
    );
  }

  // Rejected - allow resubmission
  if (verification?.status === 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Rejected</h1>
            <p className="text-red-600 font-medium">{verification.rejectionReason}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Please resubmit</strong> with clearer images following the guidelines below.
            </p>
          </div>

          <KYCForm
            formData={formData}
            setFormData={setFormData}
            handleFileUpload={handleFileUpload}
            handleSubmit={handleSubmit}
            loading={loading}
            step={step}
            setStep={setStep}
          />
        </div>
      </div>
    );
  }

  // First time submission
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
          <p className="text-gray-600">
            Verify your identity to unlock all platform features and build trust with other users.
          </p>
        </div>

        <KYCForm
          formData={formData}
          setFormData={setFormData}
          handleFileUpload={handleFileUpload}
          handleSubmit={handleSubmit}
          loading={loading}
          step={step}
          setStep={setStep}
        />
      </div>
    </div>
  );
}

function KYCForm({
  formData,
  setFormData,
  handleFileUpload,
  handleSubmit,
  loading,
  step,
  setStep,
}: {
  formData: { idDocFront: string; idDocBack: string; selfie: string };
  setFormData: (data: { idDocFront: string; idDocBack: string; selfie: string }) => void;
  handleFileUpload: (file: File, field: 'idDocFront' | 'idDocBack' | 'selfie') => Promise<void>;
  handleSubmit: () => Promise<void>;
  loading: boolean;
  step: number;
  setStep: (step: number) => void;
}) {
  return (
    <div>
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            step >= 1 ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Upload ID</span>
        </div>
        <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            step >= 2 ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Review & Submit</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* ID Front */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Document (Front) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition">
              {formData.idDocFront ? (
                <div>
                  <img src={formData.idDocFront} alt="ID Front" className="max-h-48 mx-auto rounded-lg mb-2" />
                  <p className="text-sm text-green-600">✓ Uploaded</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Click to upload ID front</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'idDocFront')}
                    className="hidden"
                    id="id-front-upload"
                  />
                  <label htmlFor="id-front-upload" className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ID Back */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Document (Back) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition">
              {formData.idDocBack ? (
                <div>
                  <img src={formData.idDocBack} alt="ID Back" className="max-h-48 mx-auto rounded-lg mb-2" />
                  <p className="text-sm text-green-600">✓ Uploaded</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Click to upload ID back</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'idDocBack')}
                    className="hidden"
                    id="id-back-upload"
                  />
                  <label htmlFor="id-back-upload" className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Selfie (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selfie with ID (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 transition">
              {formData.selfie ? (
                <div>
                  <img src={formData.selfie} alt="Selfie" className="max-h-48 mx-auto rounded-lg mb-2" />
                  <p className="text-sm text-green-600">✓ Uploaded</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Upload selfie holding your ID</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'selfie')}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label htmlFor="selfie-upload" className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Review Your Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">ID Front</p>
                <img src={formData.idDocFront} alt="ID Front" className="rounded-lg h-32 object-cover" />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">ID Back</p>
                <img src={formData.idDocBack} alt="ID Back" className="rounded-lg h-32 object-cover" />
              </div>
            </div>
            {formData.selfie && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Selfie</p>
                <img src={formData.selfie} alt="Selfie" className="rounded-lg h-32 object-cover" />
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> By submitting, you confirm that these documents are genuine and belong to you.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
