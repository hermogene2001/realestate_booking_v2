import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { documentUpload, handleDocumentUploadError } from '../middleware/documentUpload';
import { PropertyDocumentService } from '../services/propertyDocument.service';
import { PropertyService } from '../services/property.service';
import { NotificationService } from '../services/notification.service';
import { z } from 'zod';
import { prisma } from '../config/database';

const router = Router();

// Validation schemas
const uploadDocumentSchema = z.object({
  documentType: z.enum(['UPI', 'LAND_TITLE', 'LAND_CERTIFICATE', 'CERTIFICATE_OF_LAND_REGISTRATION']),
});

const rejectDocumentSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

// POST /properties/:propertyId/documents - Upload document
router.post(
  '/properties/:propertyId/documents',
  authenticate,
  documentUpload.single('file'),
  handleDocumentUploadError,
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const userId = (req as any).user!.id;

      // Validate request body
      const validation = uploadDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid document type',
          details: validation.error.errors,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      const document = await PropertyDocumentService.uploadDocument(
        propertyId,
        userId,
        req.file,
        validation.data.documentType
      );

      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /properties/:propertyId/documents - List documents for property
router.get(
  '/properties/:propertyId/documents',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const documents = await PropertyDocumentService.getDocumentsByProperty(propertyId);
      res.json(documents);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /properties/:propertyId/documents/:documentId - Get single document
router.get(
  '/properties/:propertyId/documents/:documentId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const document = await PropertyDocumentService.getDocumentById(documentId);
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /properties/:propertyId/documents/:documentId - Delete document
router.delete(
  '/properties/:propertyId/documents/:documentId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const userId = (req as any).user!.id;

      await PropertyDocumentService.deleteDocument(documentId, userId);
      res.json({ message: 'Document deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PATCH /admin/properties/:propertyId/documents/:documentId/approve - Approve document
router.patch(
  '/admin/properties/:propertyId/documents/:documentId/approve',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const reviewedBy = (req as any).user!.id;

      const document = await PropertyDocumentService.approveDocument(documentId, reviewedBy);
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PATCH /admin/properties/:propertyId/documents/:documentId/reject - Reject document
router.patch(
  '/admin/properties/:propertyId/documents/:documentId/reject',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const reviewedBy = (req as any).user!.id;

      // Validate request body
      const validation = rejectDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid rejection reason',
          details: validation.error.errors,
        });
      }

      const document = await PropertyDocumentService.rejectDocument(
        documentId,
        validation.data.rejectionReason,
        reviewedBy
      );

      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /admin/properties/approval-status/:propertyId - Get approval status
router.get(
  '/admin/properties/approval-status/:propertyId',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const status = await PropertyService.getPropertyApprovalStatus(propertyId);
      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PATCH /admin/properties/:propertyId/approve - Approve property with document check
router.patch(
  '/admin/properties/:propertyId/approve',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const { location, district, lat, lng } = req.body;
      const property = await PropertyService.approvePropertyWithDocumentCheck(propertyId, {
        location, district, lat, lng,
      });
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET /admin/properties/pending - Get all pending properties with documents
router.get(
  '/admin/properties/pending',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const properties = await PropertyService.getPendingPropertiesWithDocuments();
      res.json({ properties });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// PATCH /admin/properties/:propertyId/reject - Reject property
router.patch(
  '/admin/properties/:propertyId/reject',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const property = await prisma.property.update({
        where: { id: propertyId },
        data: {
          rejectionReason,
          isApproved: false,
        } as any,
      });

      // Notify owner
      const owner = await prisma.user.findUnique({
        where: { id: property.ownerId },
      });

      if (owner) {
        await NotificationService.create(
          owner.id,
          'PROPERTY_REJECTED',
          `Your property "${property.title}" has been rejected. Reason: ${rejectionReason}`,
          { propertyId }
        );
      }

      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
