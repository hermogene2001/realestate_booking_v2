import { prisma } from '../config/database';
import { NotificationService } from './notification.service';
import { ALLOWED_DOCUMENT_TYPES } from '../config/documentUpload';
import fs from 'fs';
import path from 'path';

export type DocumentType = 'UPI' | 'LAND_TITLE' | 'LAND_CERTIFICATE' | 'CERTIFICATE_OF_LAND_REGISTRATION';

export interface PropertyDocument {
  id: number;
  propertyId: number;
  documentType: DocumentType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
}

export class PropertyDocumentService {
  /**
   * Upload a property document
   * Validates ownership, document type, file size, and prevents duplicates
   */
  static async uploadDocument(
    propertyId: number,
    userId: number,
    file: Express.Multer.File,
    documentType: string
  ): Promise<PropertyDocument> {
    // Validate property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Validate property ownership
    if (property.ownerId !== userId) {
      throw new Error('Not authorized to upload documents for this property');
    }

    // Validate property is not yet approved
    if (property.isApproved) {
      throw new Error('Cannot upload documents for approved property');
    }

    // Validate document type
    if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      throw new Error(`Invalid document type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`);
    }

    // Check for duplicate document type (non-rejected)
    const existing = await prisma.propertyDocument.findFirst({
      where: {
        propertyId,
        documentType,
        status: {
          in: ['PENDING_REVIEW', 'APPROVED'],
        },
      },
    });

    if (existing) {
      throw new Error('Document of this type already uploaded');
    }

    // Create database record
    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId,
        documentType,
        filePath: file.path,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING_REVIEW',
        uploadedAt: new Date(),
      },
    });

    // Send notification to owner
    await NotificationService.create(
      userId,
      'DOCUMENT_UPLOADED',
      `Document ${documentType} uploaded successfully`,
      {
        documentType,
        propertyId,
        documentId: doc.id,
      }
    );

    return doc as PropertyDocument;
  }

  /**
   * Get all documents for a property
   */
  static async getDocumentsByProperty(propertyId: number): Promise<PropertyDocument[]> {
    const documents = await prisma.propertyDocument.findMany({
      where: { propertyId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents as PropertyDocument[];
  }

  /**
   * Get a single document by ID
   */
  static async getDocumentById(documentId: number): Promise<PropertyDocument> {
    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    return doc as PropertyDocument;
  }

  /**
   * Reject a document with a reason
   */
  static async rejectDocument(
    documentId: number,
    rejectionReason: string,
    reviewedBy: number
  ): Promise<PropertyDocument> {
    // Validate rejection reason length
    if (!rejectionReason || rejectionReason.length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // Get document
    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      include: { property: true },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    // Update document status
    const updated = await prisma.propertyDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    // Notify owner
    await NotificationService.create(
      doc.property.ownerId,
      'DOCUMENT_REJECTED',
      `Document ${doc.documentType} has been rejected`,
      {
        documentType: doc.documentType,
        rejectionReason,
        propertyId: doc.propertyId,
        documentId,
      }
    );

    return updated as PropertyDocument;
  }

  /**
   * Approve a document
   */
  static async approveDocument(
    documentId: number,
    reviewedBy: number
  ): Promise<PropertyDocument> {
    // Get document
    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      include: { property: true },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    // Update document status
    const updated = await prisma.propertyDocument.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    // Notify owner
    await NotificationService.create(
      doc.property.ownerId,
      'DOCUMENT_APPROVED',
      `Document ${doc.documentType} has been approved`,
      {
        documentType: doc.documentType,
        propertyId: doc.propertyId,
        documentId,
      }
    );

    return updated as PropertyDocument;
  }

  /**
   * Check if at least one document is uploaded for a property
   */
  static async checkAllDocumentsUploaded(propertyId: number): Promise<boolean> {
    const count = await prisma.propertyDocument.count({
      where: {
        propertyId,
        status: { in: ['PENDING_REVIEW', 'APPROVED'] },
      },
    });

    return count > 0;
  }

  /**
   * Get missing document types for a property (returns empty if at least one exists)
   */
  static async getMissingDocumentTypes(propertyId: number): Promise<DocumentType[]> {
    const doc = await prisma.propertyDocument.findFirst({
      where: {
        propertyId,
        status: { in: ['PENDING_REVIEW', 'APPROVED'] },
      },
    });

    if (doc) return [];

    const requiredTypes: DocumentType[] = [
      'UPI',
      'LAND_TITLE',
      'LAND_CERTIFICATE',
      'CERTIFICATE_OF_LAND_REGISTRATION',
    ];

    const missing: DocumentType[] = [];

    for (const type of requiredTypes) {
      missing.push(type);
    }

    return missing;
  }

  /**
   * Delete a document (owner only, PENDING_REVIEW or REJECTED only)
   */
  static async deleteDocument(documentId: number, userId: number): Promise<void> {
    // Get document
    const doc = await prisma.propertyDocument.findUnique({
      where: { id: documentId },
      include: { property: true },
    });

    if (!doc) {
      throw new Error('Document not found');
    }

    // Validate ownership
    if (doc.property.ownerId !== userId) {
      throw new Error('Not authorized to delete this document');
    }

    // Only allow deletion if PENDING_REVIEW or REJECTED
    if (!['PENDING_REVIEW', 'REJECTED'].includes(doc.status)) {
      throw new Error('Cannot delete approved documents');
    }

    // Delete file from storage
    try {
      if (fs.existsSync(doc.filePath)) {
        fs.unlinkSync(doc.filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await prisma.propertyDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Get document approval status for a property
   */
  static async getPropertyApprovalStatus(propertyId: number) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const documents = await prisma.propertyDocument.findMany({
      where: { propertyId },
    });

    const requiredTypes: DocumentType[] = [
      'UPI',
      'LAND_TITLE',
      'LAND_CERTIFICATE',
      'CERTIFICATE_OF_LAND_REGISTRATION',
    ];

    const documentStatus = requiredTypes.map((type) => {
      const doc = documents.find((d) => d.documentType === type);
      return {
        type,
        status: doc?.status || 'MISSING',
      };
    });

    const allUploaded = await this.checkAllDocumentsUploaded(propertyId);
    const hasRejected = documents.some((d) => d.status === 'REJECTED');

    return {
      propertyId,
      isApproved: property.isApproved,
      documentsUploaded: allUploaded,
      documentCount: documents.length,
      requiredDocumentCount: requiredTypes.length,
      hasRejected,
      documents: documentStatus,
    };
  }
}
