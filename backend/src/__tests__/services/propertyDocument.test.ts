import { PropertyDocumentService } from '../../services/propertyDocument.service';
import { NotificationService } from '../../services/notification.service';
import { prisma } from '../../config/database';
import fs from 'fs';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/notification.service');
jest.mock('fs');

describe('PropertyDocumentService', () => {
  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '/uploads',
    filename: 'test.pdf',
    path: '/uploads/test.pdf',
    buffer: Buffer.from('test'),
    stream: null as any,
  };

  const mockProperty = {
    id: 1,
    ownerId: 1,
    title: 'Test Property',
    description: 'Test',
    location: 'Kigali',
    district: 'Kigali',
    lat: -1.9536,
    lng: 29.8739,
    priceEth: '1.0',
    depositEth: '0.5',
    images: [],
    bedrooms: 2,
    bathrooms: 1,
    area: 100,
    amenities: [],
    status: 'AVAILABLE',
    isApproved: false,
    isVerified: false,
    verificationDoc: null,
    qrCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload a valid document', async () => {
      const mockDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        filePath: '/uploads/test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        status: 'PENDING_REVIEW',
        rejectionReason: null,
        uploadedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      };

      (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (prisma.propertyDocument.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.propertyDocument.create as jest.Mock).mockResolvedValue(mockDoc);
      (NotificationService.create as jest.Mock).mockResolvedValue({});

      const result = await PropertyDocumentService.uploadDocument(1, 1, mockFile, 'UPI');

      expect(result).toEqual(mockDoc);
      expect(prisma.property.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(NotificationService.create).toHaveBeenCalledWith(
        1,
        'DOCUMENT_UPLOADED',
        expect.any(String),
        expect.objectContaining({ documentType: 'UPI' })
      );
    });

    it('should reject upload for non-owner', async () => {
      (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);

      await expect(
        PropertyDocumentService.uploadDocument(1, 999, mockFile, 'UPI')
      ).rejects.toThrow('Not authorized to upload documents for this property');
    });

    it('should reject upload for approved property', async () => {
      const approvedProperty = { ...mockProperty, isApproved: true };
      (prisma.property.findUnique as jest.Mock).mockResolvedValue(approvedProperty);

      await expect(
        PropertyDocumentService.uploadDocument(1, 1, mockFile, 'UPI')
      ).rejects.toThrow('Cannot upload documents for approved property');
    });

    it('should reject invalid document type', async () => {
      (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);

      await expect(
        PropertyDocumentService.uploadDocument(1, 1, mockFile, 'INVALID_TYPE')
      ).rejects.toThrow('Invalid document type');
    });

    it('should reject duplicate document type', async () => {
      const existingDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        status: 'PENDING_REVIEW',
      };

      (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (prisma.propertyDocument.findFirst as jest.Mock).mockResolvedValue(existingDoc);

      await expect(
        PropertyDocumentService.uploadDocument(1, 1, mockFile, 'UPI')
      ).rejects.toThrow('Document of this type already uploaded');
    });
  });

  describe('checkAllDocumentsUploaded', () => {
    it('should return true when all documents are uploaded', async () => {
      const mockDocs = [
        { documentType: 'UPI', status: 'PENDING_REVIEW' },
        { documentType: 'LAND_TITLE', status: 'APPROVED' },
        { documentType: 'LAND_CERTIFICATE', status: 'PENDING_REVIEW' },
        { documentType: 'CERTIFICATE_OF_LAND_REGISTRATION', status: 'APPROVED' },
      ];

      (prisma.propertyDocument.findFirst as jest.Mock).mockResolvedValue(mockDocs[0]);

      const result = await PropertyDocumentService.checkAllDocumentsUploaded(1);

      expect(result).toBe(true);
      expect(prisma.propertyDocument.findFirst).toHaveBeenCalledTimes(4);
    });

    it('should return false when documents are missing', async () => {
      (prisma.propertyDocument.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PropertyDocumentService.checkAllDocumentsUploaded(1);

      expect(result).toBe(false);
    });

    it('should return false when all documents are rejected', async () => {
      (prisma.propertyDocument.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await PropertyDocumentService.checkAllDocumentsUploaded(1);

      expect(result).toBe(false);
    });
  });

  describe('rejectDocument', () => {
    it('should reject a document with valid reason', async () => {
      const mockDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        status: 'PENDING_REVIEW',
        property: mockProperty,
      };

      const rejectedDoc = {
        ...mockDoc,
        status: 'REJECTED',
        rejectionReason: 'Document is unclear',
        reviewedAt: new Date(),
        reviewedBy: 2,
      };

      (prisma.propertyDocument.findUnique as jest.Mock).mockResolvedValue(mockDoc);
      (prisma.propertyDocument.update as jest.Mock).mockResolvedValue(rejectedDoc);
      (NotificationService.create as jest.Mock).mockResolvedValue({});

      const result = await PropertyDocumentService.rejectDocument(
        1,
        'Document is unclear',
        2
      );

      expect(result.status).toBe('REJECTED');
      expect(NotificationService.create).toHaveBeenCalledWith(
        mockProperty.ownerId,
        'DOCUMENT_REJECTED',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should reject reason shorter than 10 characters', async () => {
      await expect(
        PropertyDocumentService.rejectDocument(1, 'short', 2)
      ).rejects.toThrow('Rejection reason must be at least 10 characters');
    });

    it('should throw error for non-existent document', async () => {
      (prisma.propertyDocument.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        PropertyDocumentService.rejectDocument(999, 'Document is unclear', 2)
      ).rejects.toThrow('Document not found');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document by owner', async () => {
      const mockDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        status: 'PENDING_REVIEW',
        filePath: '/uploads/test.pdf',
        property: mockProperty,
      };

      (prisma.propertyDocument.findUnique as jest.Mock).mockResolvedValue(mockDoc);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      (prisma.propertyDocument.delete as jest.Mock).mockResolvedValue(mockDoc);

      await PropertyDocumentService.deleteDocument(1, 1);

      expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/test.pdf');
      expect(prisma.propertyDocument.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should reject deletion by non-owner', async () => {
      const mockDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        status: 'PENDING_REVIEW',
        property: mockProperty,
      };

      (prisma.propertyDocument.findUnique as jest.Mock).mockResolvedValue(mockDoc);

      await expect(
        PropertyDocumentService.deleteDocument(1, 999)
      ).rejects.toThrow('Not authorized to delete this document');
    });

    it('should reject deletion of approved documents', async () => {
      const mockDoc = {
        id: 1,
        propertyId: 1,
        documentType: 'UPI',
        status: 'APPROVED',
        property: mockProperty,
      };

      (prisma.propertyDocument.findUnique as jest.Mock).mockResolvedValue(mockDoc);

      await expect(
        PropertyDocumentService.deleteDocument(1, 1)
      ).rejects.toThrow('Cannot delete approved documents');
    });
  });

  describe('getMissingDocumentTypes', () => {
    it('should return missing document types', async () => {
      (prisma.propertyDocument.findFirst as jest.Mock)
        .mockResolvedValueOnce({ documentType: 'UPI' }) // UPI exists
        .mockResolvedValueOnce(null) // LAND_TITLE missing
        .mockResolvedValueOnce({ documentType: 'LAND_CERTIFICATE' }) // LAND_CERTIFICATE exists
        .mockResolvedValueOnce(null); // CERTIFICATE_OF_LAND_REGISTRATION missing

      const result = await PropertyDocumentService.getMissingDocumentTypes(1);

      expect(result).toContain('LAND_TITLE');
      expect(result).toContain('CERTIFICATE_OF_LAND_REGISTRATION');
      expect(result.length).toBe(2);
    });
  });

  describe('getPropertyApprovalStatus', () => {
    it('should return approval status with document details', async () => {
      (prisma.property.findUnique as jest.Mock).mockResolvedValue(mockProperty);
      (prisma.propertyDocument.findMany as jest.Mock).mockResolvedValue([
        { documentType: 'UPI', status: 'APPROVED' },
        { documentType: 'LAND_TITLE', status: 'PENDING_REVIEW' },
      ]);

      const result = await PropertyDocumentService.getPropertyApprovalStatus(1);

      expect(result.propertyId).toBe(1);
      expect(result.isApproved).toBe(false);
      expect(result.documentCount).toBe(2);
      expect(result.requiredDocumentCount).toBe(4);
    });
  });
});
