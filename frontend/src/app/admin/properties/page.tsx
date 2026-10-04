'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api, { API_BASE } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';

interface PropertyDocument {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
}

interface Property {
  id: number;
  title: string;
  location: string;
  district: string;
  lat?: number;
  lng?: number;
  priceEth: string;
  bedrooms: number;
  bathrooms: number;
  owner: {
    name: string;
    email: string;
  };
  isApproved: boolean;
  propertyDocuments: PropertyDocument[];
}

export default function AdminPropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PropertyDocument | null>(null);
  const [documentRejectReasons, setDocumentRejectReasons] = useState<Record<number, string>>({});
  const [actingDocId, setActingDocId] = useState<number | null>(null);

  const [locationInput, setLocationInput] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [mapLat, setMapLat] = useState<number>(-1.9441);
  const [mapLng, setMapLng] = useState<number>(30.0619);

  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'KigaliRealEstate/1.0' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      setLocationInput(addr.road || addr.suburb || addr.town || addr.village || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setDistrictInput(addr.city || addr.state_district || addr.municipality || addr.county || '');
    } catch {
      setLocationInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPendingProperties();
    }
  }, [user]);

  const fetchPendingProperties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/properties/pending');
      setProperties(data.properties || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProperty) {
      setLocationInput(selectedProperty.location);
      setDistrictInput(selectedProperty.district);
      setMapLat(Number(selectedProperty.lat) || -1.9441);
      setMapLng(Number(selectedProperty.lng) || 30.0619);
    }
  }, [selectedProperty]);

  const handleApproveProperty = async (propertyId: number) => {
    if (!selectedProperty) return;

    setIsApproving(true);
    try {
      const body: Record<string, any> = {};
      if (locationInput !== selectedProperty.location) body.location = locationInput;
      if (districtInput !== selectedProperty.district) body.district = districtInput;
      if (mapLat !== Number(selectedProperty.lat)) body.lat = mapLat;
      if (mapLng !== Number(selectedProperty.lng)) body.lng = mapLng;
      await api.patch(`/admin/properties/${propertyId}/approve`, Object.keys(body).length > 0 ? body : undefined);
      toast.success('Property approved successfully!');
      setSelectedProperty(null);
      fetchPendingProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve property');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectProperty = async (propertyId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsApproving(true);
    try {
      await api.patch(`/admin/properties/${propertyId}/reject`, {
        rejectionReason,
      });
      toast.success('Property rejected');
      setSelectedProperty(null);
      setRejectionReason('');
      fetchPendingProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject property');
    } finally {
      setIsApproving(false);
    }
  };

  const handleApproveDocument = async (propertyId: number, documentId: number) => {
    setActingDocId(documentId);
    try {
      await api.patch(`/admin/properties/${propertyId}/documents/${documentId}/approve`);
      toast.success('Document approved');
      fetchPendingProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve document');
    } finally {
      setActingDocId(null);
    }
  };

  const handleRejectDocument = async (propertyId: number, documentId: number) => {
    const reason = documentRejectReasons[documentId];
    if (!reason?.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActingDocId(documentId);
    try {
      await api.patch(`/admin/properties/${propertyId}/documents/${documentId}/reject`, { rejectionReason: reason });
      toast.success('Document rejected');
      setDocumentRejectReasons(prev => ({ ...prev, [documentId]: '' }));
      fetchPendingProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject document');
    } finally {
      setActingDocId(null);
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600';
      case 'REJECTED':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (authLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-500">Loading…</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Property Approval Dashboard</h1>

      {loading ? (
        <div className="text-center text-gray-500">Loading properties…</div>
      ) : properties.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No pending properties to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{property.title}</h2>
                  <p className="text-gray-600">{property.location}, {property.district}</p>
                  <p className="text-sm text-gray-500 mt-1">Owner: {property.owner.name} ({property.owner.email})</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(property)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Eye className="w-4 h-4" />
                  Review Documents
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold">{property.priceEth} ETH/month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bedrooms/Bathrooms</p>
                  <p className="font-semibold">{property.bedrooms}/{property.bathrooms}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {property.propertyDocuments && property.propertyDocuments.length > 0 ? (
                    property.propertyDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                          doc.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {getDocumentStatusIcon(doc.status)}
                        <span>{doc.documentType}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No documents uploaded yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Review Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedProperty.title}</h2>
              <button
                onClick={() => {
                  setSelectedProperty(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Property Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Location (click map to set)
                    </p>
                    <div className="h-48 rounded-lg overflow-hidden border border-gray-300 mb-2">
                      <LocationPicker lat={mapLat} lng={mapLng} onChange={handleLocationChange} />
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mb-2">
                      <span>Lat: {mapLat.toFixed(4)}</span>
                      <span>Lng: {mapLng.toFixed(4)}</span>
                    </div>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      placeholder="Location name"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm mb-1"
                    />
                    <input
                      type="text"
                      value={districtInput}
                      onChange={e => setDistrictInput(e.target.value)}
                      placeholder="District"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-gray-600">Price</p>
                    <p className="font-medium">{selectedProperty.priceEth} ETH/month</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bedrooms/Bathrooms</p>
                    <p className="font-medium">{selectedProperty.bedrooms}/{selectedProperty.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner</p>
                    <p className="font-medium">{selectedProperty.owner.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Owner Email</p>
                    <p className="font-medium">{selectedProperty.owner.email}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
                <div className="space-y-2">
                  {selectedProperty.propertyDocuments && selectedProperty.propertyDocuments.length > 0 ? (
                    selectedProperty.propertyDocuments.map((doc) => (
                      <div key={doc.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{doc.documentType}</p>
                              <p className="text-sm text-gray-600">{doc.fileName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            {doc.status === 'APPROVED' ? (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span>Approved</span>
                              </div>
                            ) : doc.status === 'REJECTED' ? (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                                <XCircle className="w-4 h-4" />
                                <span>Rejected</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveDocument(selectedProperty.id, doc.id)}
                                  disabled={actingDocId === doc.id}
                                  className="flex items-center gap-1 px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition disabled:opacity-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = documentRejectReasons[doc.id];
                                    if (reason?.trim()) {
                                      handleRejectDocument(selectedProperty.id, doc.id);
                                    } else {
                                      const el = document.getElementById(`reject-input-${doc.id}`);
                                      el?.focus();
                                    }
                                  }}
                                  disabled={actingDocId === doc.id}
                                  className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {doc.status === 'PENDING_REVIEW' && (
                          <div className="flex items-center gap-2 pl-11">
                            <input
                              id={`reject-input-${doc.id}`}
                              type="text"
                              placeholder="Reason for rejection..."
                              value={documentRejectReasons[doc.id] || ''}
                              onChange={e => setDocumentRejectReasons(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRejectDocument(selectedProperty.id, doc.id);
                              }}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                            {documentRejectReasons[doc.id]?.trim() && (
                              <button
                                onClick={() => handleRejectDocument(selectedProperty.id, doc.id)}
                                disabled={actingDocId === doc.id}
                                className="text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap disabled:opacity-50"
                              >
                                Submit
                              </button>
                            )}
                          </div>
                        )}
                        {doc.status === 'REJECTED' && doc.rejectionReason && (
                          <p className="text-xs text-red-600 pl-11">Reason: {doc.rejectionReason}</p>
                        )}
                      </div> 
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No documents uploaded yet</p>
                  )}
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedProperty.propertyDocuments && selectedProperty.propertyDocuments.some(d => d.status === 'REJECTED') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Rejection Reasons:</p>
                  {selectedProperty.propertyDocuments
                    .filter(d => d.status === 'REJECTED' && d.rejectionReason)
                    .map((doc) => (
                      <p key={doc.id} className="text-sm text-red-600">
                        • {doc.documentType}: {doc.rejectionReason}
                      </p>
                    ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-6 space-y-4">
                {!selectedProperty.propertyDocuments || selectedProperty.propertyDocuments.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ No documents uploaded yet. The owner must upload required documents before this property can be approved.
                    </p>
                  </div>
                ) : selectedProperty.propertyDocuments.every(d => d.status === 'APPROVED') ? (
                  <div>
                    <button
                      onClick={() => handleApproveProperty(selectedProperty.id)}
                      disabled={isApproving}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isApproving ? 'Approving…' : 'Approve Property'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ All documents must be approved before you can approve the property.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why you're rejecting this property..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  />
                  <button
                    onClick={() => handleRejectProperty(selectedProperty.id)}
                    disabled={isApproving}
                    className="w-full mt-2 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isApproving ? 'Rejecting…' : 'Reject Property'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    setRejectionReason('');
                  }}
                  className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">{previewDoc.documentType}</h3>
                <p className="text-sm text-gray-500">{previewDoc.fileName}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-gray-100 min-h-[60vh] relative">
              {previewDoc.mimeType?.startsWith('image/') ? (
                <img src={`${API_BASE}${previewDoc.fileUrl}`} alt={previewDoc.fileName} className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <embed src={`${API_BASE}${previewDoc.fileUrl}`} type={previewDoc.mimeType} className="w-full h-[70vh]" />
              )}
              <a
                href={`${API_BASE}${previewDoc.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
