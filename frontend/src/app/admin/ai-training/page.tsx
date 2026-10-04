'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AITrainingPage() {
  const [training, setTraining] = useState(false);
  const [modelInfo, setModelInfo] = useState<{
    version: number;
    trainedAt: string;
    stats: { knowledgeBaseSize: number; totalProperties: number; totalBookings: number; totalUsers: number; trainingLoss: number };
    regression: { rSquared: number; sampleCount: number; featureNames: string[] };
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const loadModelInfo = async () => {
    setLoadingInfo(true);
    try {
      const { data } = await api.get('/training/model-info');
      setModelInfo(data.model);
    } catch {
      toast.error('Failed to load model info');
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const { data } = await api.post('/training/train');
      toast.success(data.message || 'Model trained!');
      setModelInfo(data.model);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Model Training</h1>
          <p className="text-sm text-gray-500 mt-1">Train and manage the local AI model from scratch</p>
        </div>
        <button
          onClick={loadModelInfo}
          disabled={loadingInfo}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition"
        >
          {loadingInfo ? 'Loading...' : 'Refresh Model Info'}
        </button>
      </div>

      {/* Training Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Train Model</h2>
            <p className="text-sm text-gray-500 max-w-lg">
              Trains the AI model using gradient descent regression on all property data and builds TF-IDF vectors
              from the knowledge base. The trained model powers price predictions, fair price badges, and the
              RAG-enhanced chat assistant — entirely offline, no external APIs.
            </p>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {training ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Training...
              </>
            ) : (
              '▶ Train Model'
            )}
          </button>
        </div>
      </div>

      {/* Model Info Card */}
      {modelInfo ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trained Model</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{modelInfo.stats?.knowledgeBaseSize || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Knowledge Entries</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{modelInfo.stats?.totalProperties || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Properties</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{modelInfo.regression?.sampleCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Training Samples</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{(modelInfo.regression?.rSquared || 0).toFixed(4)}</p>
              <p className="text-xs text-gray-500 mt-1">R² Score</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">
              Model version: {modelInfo.version} &middot; Trained: {modelInfo.trainedAt ? new Date(modelInfo.trainedAt).toLocaleString() : 'N/A'}
              &middot; Features: {modelInfo.regression?.featureNames?.join(', ') || ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Model Trained</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click "Train Model" above to build the AI model from scratch. This will analyze all property data
            using gradient descent regression and build a comprehensive knowledge base retrieval system.
          </p>
        </div>
      )}
    </div>
  );
}
