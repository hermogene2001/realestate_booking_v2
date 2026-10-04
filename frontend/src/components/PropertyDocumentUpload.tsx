'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

type DocumentType = 'UPI' | 'LAND_TITLE' | 'LAND_CERTIFICATE' | 'CERTIFICATE_OF_LAND_REGISTRATION';

interface UploadedDocument {
  id: number;
  documentType: DocumentType;
  fileName: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

interface PropertyDocumentUploadProps {
  propertyId: number;
  onUploadSuccess?: (document: UploadedDocument) => void;
  onUploadError?: (error: string) => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'UPI', label: 'Unique Property Identifier (UPI)' },
  { value: 'LAND_TITLE', label: 'Land Title' },
  { value: 'LAND_CERTIFICATE', label: 'Land Certificate' },
  { value: 'CERTIFICATE_OF_LAND_REGISTRATION', label: 'Certificate of Land Registration' },
];

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function PropertyDocumentUpload({
  propertyId,
  onUploadSuccess,
  onUploadError,
}: PropertyDocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      return 'Invalid file type. Only PDF, JPEG, and PNG are allowed.';
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !file) {
      setError('Please select a document type and file.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedType);

      const response = await api.post(`/properties/${propertyId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedDoc = response.data;
      setSuccess(`${selectedType} uploaded successfully!`);
      setFile(null);
      setSelectedType('');

      if (onUploadSuccess) {
        onUploadSuccess(uploadedDoc);
      }

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Property Documents</h2>

      {/* Document Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type *
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a document type...</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-lg font-medium text-gray-700">
            {file ? file.name : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            PDF, JPEG, or PNG (Max 10MB)
          </p>
        </button>
      </div>

      {/* File Info */}
      {file && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
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

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedType || !file || uploading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !selectedType || !file || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>

      {/* Info Text */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        All four document types are required before your property can be approved.
      </p>
    </div>
  );
}
