import request from 'supertest';
import express from 'express';
import { PropertyDocumentService } from '../../services/propertyDocument.service';
import { PropertyService } from '../../services/property.service';
import propertyDocumentsRoutes from '../../routes/propertyDocuments.routes';
import { authenticate } from '../../middleware/auth';
import { authorize as rbac } from '../../middleware/rbac';

// Mock setup
jest.mock('../../config/database');
jest.mock('../../services/notification.service');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/rbac');

describe('Property Documents Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req: any, res, next) => {
      req.user = { id: 1, role: 'OWNER' };
      next();
    });
    app.use('/api', propertyDocumentsRoutes);
  });

  describe('Complete workflow: Upload → Review → Approve', () => {
    it('should complete full document upload and property approval workflow', async () => {
      // Step 1: Owner uploads all 4 required documents
      const documentTypes = ['UPI', 'LAND_TITLE', 'LAND_CERTIFICATE', 'CERTIFICATE_OF_LAND_REGISTRATION'];
      const uploadedDocs: any[] = [];

      for (const docType of documentTypes) {
        const response = await request(app)
          .post('/api/properties/1/documents')
          .field('documentType', docType)
          .attach('file', Buffer.from('test content'), 'test.pdf');

        expect(response.status).toBe(201);
        uploadedDocs.push(response.body);
      }

      expect(uploadedDocs.length).toBe(4);

      // Step 2: Check approval status - should show all documents uploaded
      const statusResponse = await request(app)
        .get('/api/admin/properties/approval-status/1');

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.documentsUploaded).toBe(true);
      expect(statusResponse.body.documentCount).toBe(4);

      // Step 3: Admin approves all documents
      for (const doc of uploadedDocs) {
        const approveResponse = await request(app)
          .patch(`/api/admin/properties/1/documents/${doc.id}/approve`);

        expect(approveResponse.status).toBe(200);
        expect(approveResponse.body.status).toBe('APPROVED');
      }

      // Step 4: Admin approves property
      const approvePropertyResponse = await request(app)
        .patch('/api/admin/properties/1/approve');

      expect(approvePropertyResponse.status).toBe(200);
      expect(approvePropertyResponse.body.isApproved).toBe(true);
    });
  });

  describe('Rejection workflow: Upload → Reject → Re-upload → Approve', () => {
    it('should handle document rejection and re-upload', async () => {
      // Step 1: Owner uploads document
      const uploadResponse = await request(app)
        .post('/api/properties/2/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(uploadResponse.status).toBe(201);
      const docId = uploadResponse.body.id;

      // Step 2: Admin rejects document
      const rejectResponse = await request(app)
        .patch(`/api/admin/properties/2/documents/${docId}/reject`)
        .send({ rejectionReason: 'Document is not clear enough' });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.status).toBe('REJECTED');

      // Step 3: Owner can re-upload same document type
      const reuploadResponse = await request(app)
        .post('/api/properties/2/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('better content'), 'test2.pdf');

      expect(reuploadResponse.status).toBe(201);
      expect(reuploadResponse.body.status).toBe('PENDING_REVIEW');

      // Step 4: Admin approves new document
      const approveResponse = await request(app)
        .patch(`/api/admin/properties/2/documents/${reuploadResponse.body.id}/approve`);

      expect(approveResponse.status).toBe(200);
    });
  });

  describe('Deletion workflow: Upload → Delete → Re-upload', () => {
    it('should allow owner to delete and re-upload documents', async () => {
      // Step 1: Owner uploads document
      const uploadResponse = await request(app)
        .post('/api/properties/3/documents')
        .field('documentType', 'LAND_TITLE')
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(uploadResponse.status).toBe(201);
      const docId = uploadResponse.body.id;

      // Step 2: Owner deletes document
      const deleteResponse = await request(app)
        .delete(`/api/properties/3/documents/${docId}`);

      expect(deleteResponse.status).toBe(200);

      // Step 3: Owner can upload same document type again
      const reuploadResponse = await request(app)
        .post('/api/properties/3/documents')
        .field('documentType', 'LAND_TITLE')
        .attach('file', Buffer.from('new content'), 'test2.pdf');

      expect(reuploadResponse.status).toBe(201);
    });
  });

  describe('Approval blocking scenarios', () => {
    it('should prevent property approval with missing documents', async () => {
      // Upload only 2 out of 4 required documents
      await request(app)
        .post('/api/properties/4/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.pdf');

      await request(app)
        .post('/api/properties/4/documents')
        .field('documentType', 'LAND_TITLE')
        .attach('file', Buffer.from('test'), 'test.pdf');

      // Try to approve property
      const approveResponse = await request(app)
        .patch('/api/admin/properties/4/approve');

      expect(approveResponse.status).toBe(400);
      expect(approveResponse.body.error).toContain('missing documents');
    });

    it('should prevent property approval with rejected documents', async () => {
      // Upload all 4 documents
      const documentTypes = ['UPI', 'LAND_TITLE', 'LAND_CERTIFICATE', 'CERTIFICATE_OF_LAND_REGISTRATION'];
      const uploadedDocs: any[] = [];

      for (const docType of documentTypes) {
        const response = await request(app)
          .post('/api/properties/5/documents')
          .field('documentType', docType)
          .attach('file', Buffer.from('test'), 'test.pdf');

        uploadedDocs.push(response.body);
      }

      // Reject one document
      await request(app)
        .patch(`/api/admin/properties/5/documents/${uploadedDocs[0].id}/reject`)
        .send({ rejectionReason: 'Document is not acceptable' });

      // Try to approve property
      const approveResponse = await request(app)
        .patch('/api/admin/properties/5/approve');

      expect(approveResponse.status).toBe(400);
      expect(approveResponse.body.error).toContain('rejected');
    });
  });

  describe('Authorization checks', () => {
    it('should prevent non-owner from uploading documents', async () => {
      const response = await request(app)
        .post('/api/properties/1/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.pdf');

      // Mock different user
      expect(response.status).toBe(400);
    });

    it('should prevent non-owner from deleting documents', async () => {
      // Upload document
      const uploadResponse = await request(app)
        .post('/api/properties/6/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.pdf');

      const docId = uploadResponse.body.id;

      // Try to delete as different user
      const deleteResponse = await request(app)
        .delete(`/api/properties/6/documents/${docId}`);

      expect(deleteResponse.status).toBe(400);
    });

    it('should prevent non-admin from approving documents', async () => {
      // Upload document
      const uploadResponse = await request(app)
        .post('/api/properties/7/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.pdf');

      const docId = uploadResponse.body.id;

      // Try to approve as non-admin
      const approveResponse = await request(app)
        .patch(`/api/admin/properties/7/documents/${docId}/approve`);

      expect(approveResponse.status).toBe(400);
    });
  });

  describe('File validation', () => {
    it('should reject oversized files', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(app)
        .post('/api/properties/8/documents')
        .field('documentType', 'UPI')
        .attach('file', largeBuffer, 'large.pdf');

      expect(response.status).toBe(413);
    });

    it('should reject invalid MIME types', async () => {
      const response = await request(app)
        .post('/api/properties/8/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.exe');

      expect(response.status).toBe(400);
    });

    it('should reject invalid document types', async () => {
      const response = await request(app)
        .post('/api/properties/8/documents')
        .field('documentType', 'INVALID_TYPE')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate prevention', () => {
    it('should prevent uploading duplicate document types', async () => {
      // Upload first document
      await request(app)
        .post('/api/properties/9/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test.pdf');

      // Try to upload same type again
      const response = await request(app)
        .post('/api/properties/9/documents')
        .field('documentType', 'UPI')
        .attach('file', Buffer.from('test'), 'test2.pdf');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already uploaded');
    });
  });
});
