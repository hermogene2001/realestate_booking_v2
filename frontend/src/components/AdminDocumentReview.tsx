'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface Document {
  id: number;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

interface ApprovalStatus {
  propertyId: number;
  isApproved: boolean;
  documentsUploaded: boolean;
  documentCount: number;
  requiredDocumentCount: number;
  hasRejected: boolean;
  documents: Array<{
    type: string;
    status: string;
  }>;
}

interface AdminDocumentReviewProps {
  propertyId: number;
  onApprovalChange?: () => void;
}

export default function AdminDocumentReview({
  propertyId,
  onApprovalChange,
}: AdminDocumentReviewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvingProperty, setApprovingProperty] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchApprovalStatus();
  }, [propertyId]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  };

  const fetchApprovalStatus = async () => {
    try {
      const response = await fetch(`/api/admin/properties/approval-status/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch approval status');
      const data = await response.json();
      setApprovalStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approval status');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async (documentId: number) => {
    setApprovingId(documentId);
    try {
      const response = await fetch(
        `/api/admin/properties/${propertyId}/documents/${documentId}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to approve document');
      await fetchDocuments();
      await fetchApprovalStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve document');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectDocument = async (documentId: number) => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    setRejectingId(documentId);
    try {
      const response = await fetch(
        `/api/admin/properties/${propertyId}/documents/${documentId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject document');
      await fetchDocuments();
      await fetchApprovalStatus();
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject document');
    } finally {
      setRejectingId(null);
    }
  };

  const handleApproveProperty = async () => {
    setApprovingProperty(true);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve property');
      }

      await fetchApprovalStatus();
      if (onApprovalChange) {
        onApprovalChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve property');
    } finally {
      setApprovingProperty(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 border-red-200';
      case 'PENDING_REVIEW':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING_REVIEW':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Document Review</h2>

      {/* Approval Status Summary */}
      {approvalStatus && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Documents Uploaded</p>
              <p className="text-lg font-bold">
                {approvalStatus.documentCount} / {approvalStatus.requiredDocumentCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Property Status</p>
              <p className="text-lg font-bold">
                {approvalStatus.isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4 mb-6">
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 border rounded-lg ${getStatusColor(doc.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{doc.documentType}</h3>
                    <p className="text-sm text-gray-600">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'APPROVED'
                      ? 'bg-green-200 text-green-800'
                      : doc.status === 'REJECTED'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {doc.status.replace('_', ' ')}
                </span>
              </div>

              {/* Rejection Reason */}
              {doc.status === 'REJECTED' && doc.rejectionReason && (
                <div className="mb-4 p-3 bg-red-100 rounded border border-red-300">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{doc.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {doc.status === 'PENDING_REVIEW' && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleApproveDocument(doc.id)}
                    disabled={approvingId === doc.id}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {approvingId === doc.id ? 'Approving...' : 'Approve Document'}
                  </button>

                  <div className="space-y-2">
                    <textarea
                      value={rejectingId === doc.id ? rejectionReason : ''}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason (min 10 characters)..."
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      rows={3}
                    />
                    <button
                      onClick={() => handleRejectDocument(doc.id)}
                      disabled={rejectingId === doc.id}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {rejectingId === doc.id ? 'Rejecting...' : 'Reject Document'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approve Property Button */}
      {approvalStatus && !approvalStatus.isApproved && (
        <button
          onClick={handleApproveProperty}
          disabled={
            !approvalStatus.documentsUploaded ||
            approvalStatus.hasRejected ||
            approvingProperty
          }
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !approvalStatus.documentsUploaded ||
            approvalStatus.hasRejected ||
            approvingProperty
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {approvingProperty ? 'Approving Property...' : 'Approve Property'}
        </button>
      )}

      {approvalStatus?.isApproved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Property Approved</p>
        </div>
      )}
    </div>
  );
}
