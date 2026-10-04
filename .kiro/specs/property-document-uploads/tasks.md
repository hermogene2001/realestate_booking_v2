# Implementation Plan: Property Document Uploads

## Overview

This feature enables property owners to upload required legal documents (UPI, land title, land certificate, or certificate of land registration) after creating a property but before admin approval. The system validates document types, stores uploads securely, tracks upload status, and prevents property approval until all required documents are submitted.

Tech stack: Node.js, TypeScript, Express, Prisma, MySQL. Dependencies: `multer` (already present), `@prisma/client`.

---

## Requirements Derived from Design

1. **Document Upload Validation**
   - 1.1 Only allow document types: UPI, LAND_TITLE, LAND_CERTIFICATE, CERTIFICATE_OF_LAND_REGISTRATION
   - 1.2 Only property owner can upload documents
   - 1.3 Cannot upload documents for already-approved properties
   - 1.4 Prevent duplicate document types (only one per type per property, unless rejected)
   - 1.5 Enforce maximum file size of 10MB
   - 1.6 Only allow MIME types: application/pdf, image/jpeg, image/png
   - 1.7 Create PropertyDocument record with status PENDING_REVIEW on successful upload
   - 1.8 Send DOCUMENT_UPLOADED notification to owner on successful upload

2. **Document Status & Property Approval**
   - 2.1 All 4 required document types must be uploaded before property approval
   - 2.2 Reject property approval if any document is REJECTED
   - 2.3 Provide clear error message indicating which documents are missing
   - 2.4 Send PROPERTY_APPROVED notification to owner on successful approval

3. **Document Rejection**
   - 3.1 Require rejection reason of at least 10 characters
   - 3.2 Send DOCUMENT_REJECTED notification to owner with rejection reason
   - 3.3 Allow owner to re-upload rejected documents

4. **Document Deletion**
   - 4.1 Only property owner can delete documents
   - 4.2 Cannot delete APPROVED documents
   - 4.3 Delete file from storage and database record on deletion

5. **Admin Workflow**
   - 5.1 Admin can view pending properties with document status
   - 5.2 Admin can review individual documents
   - 5.3 Admin can approve or reject documents
   - 5.4 Admin cannot approve property without all documents uploaded
   - 5.5 Admin receives clear feedback on approval blockers

---

## Tasks

- [x] 1. Prisma schema additions and migration
  - [x] 1.1 Add PropertyDocument model to `backend/prisma/schema.prisma`
    - Fields: id, propertyId, documentType, filePath, fileName, fileSize, mimeType, status, rejectionReason, uploadedAt, reviewedAt, reviewedBy, createdAt, updatedAt
    - Relationships: property (FK), reviewer (FK to User)
    - Indexes: propertyId, status, documentType
    - _Requirements: 1.7, 2.1, 3.1, 4.1_

  - [x] 1.2 Add PropertyDocument[] relation to Property model
    - _Requirements: 1.7_

  - [x] 1.3 Add DocumentReviewer relation to User model
    - _Requirements: 3.2_

  - [x] 1.4 Add DOCUMENT_UPLOADED, DOCUMENT_APPROVED, DOCUMENT_REJECTED, PROPERTY_APPROVED to NotificationType enum
    - _Requirements: 1.8, 2.4, 3.2_

  - [x] 1.5 Run `prisma migrate dev --name add_property_documents` to generate and apply migration
    - _Requirements: All_

- [x] 2. Upload middleware and configuration
  - [x] 2.1 Create `backend/src/middleware/documentUpload.ts`
    - Configure multer for document uploads with:
      - Destination: `{UPLOAD_DIR}/property-documents/{propertyId}`
      - Filename: `{documentType}-{timestamp}.{ext}`
      - File filter: validate MIME types (pdf, jpeg, png)
      - Size limit: 10MB
    - Export `documentUpload` middleware
    - _Requirements: 1.5, 1.6_

  - [x] 2.2 Create `backend/src/config/documentUpload.ts`
    - Export constants: MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_DOCUMENT_TYPES
    - _Requirements: 1.5, 1.6_

- [x] 3. PropertyDocumentService
  - [x] 3.1 Create `backend/src/services/propertyDocument.service.ts`
    - Implement `uploadDocument(propertyId, userId, file, documentType)` method
      - Validate property ownership
      - Validate property not approved
      - Validate document type
      - Check for duplicate document type
      - Store file
      - Create PropertyDocument record with status PENDING_REVIEW
      - Send DOCUMENT_UPLOADED notification
      - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8_

    - Implement `getDocumentsByProperty(propertyId)` method
      - Return all documents for property
      - _Requirements: 5.2_

    - Implement `getDocumentById(documentId)` method
      - Return single document
      - _Requirements: 5.2_

    - Implement `rejectDocument(documentId, rejectionReason)` method
      - Validate rejection reason length (min 10 chars)
      - Update document status to REJECTED
      - Store rejection reason and review metadata
      - Send DOCUMENT_REJECTED notification
      - _Requirements: 3.1, 3.2_

    - Implement `approveDocument(documentId)` method
      - Update document status to APPROVED
      - Store review metadata
      - Send DOCUMENT_APPROVED notification
      - _Requirements: 2.4_

    - Implement `checkAllDocumentsUploaded(propertyId)` method
      - Return true if all 4 required document types have at least one non-rejected document
      - _Requirements: 2.1_

    - Implement `deleteDocument(documentId, userId)` method
      - Validate ownership
      - Validate document status (PENDING_REVIEW or REJECTED only)
      - Delete file from storage
      - Delete database record
      - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. PropertyApprovalService extensions
  - [x] 4.1 Update `backend/src/services/property.service.ts` (or create PropertyApprovalService)
    - Add `canApproveProperty(propertyId)` method
      - Check all documents uploaded
      - Check no documents rejected
      - Return { canApprove: boolean, reason?: string }
      - _Requirements: 2.1, 2.2, 5.4_

    - Add `getPropertyApprovalStatus(propertyId)` method
      - Return approval status with document details
      - _Requirements: 5.1, 5.5_

    - Update `approveProperty(propertyId)` method
      - Call `canApproveProperty()` before approval
      - Throw error if cannot approve
      - Send PROPERTY_APPROVED notification on success
      - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Routes and endpoints
  - [x] 5.1 Create `backend/src/routes/propertyDocuments.routes.ts`
    - `POST /properties/:propertyId/documents` - Upload document
      - Middleware: auth, documentUpload
      - Call PropertyDocumentService.uploadDocument()
      - Return created document
      - _Requirements: 1.1-1.8_

    - `GET /properties/:propertyId/documents` - List documents for property
      - Middleware: auth
      - Call PropertyDocumentService.getDocumentsByProperty()
      - Return document list
      - _Requirements: 5.2_

    - `GET /properties/:propertyId/documents/:documentId` - Get single document
      - Middleware: auth
      - Call PropertyDocumentService.getDocumentById()
      - Return document
      - _Requirements: 5.2_

    - `DELETE /properties/:propertyId/documents/:documentId` - Delete document
      - Middleware: auth
      - Call PropertyDocumentService.deleteDocument()
      - Return success
      - _Requirements: 4.1, 4.2, 4.3_

    - `PATCH /admin/properties/:propertyId/documents/:documentId/approve` - Approve document
      - Middleware: auth, rbac(ADMIN)
      - Call PropertyDocumentService.approveDocument()
      - Return updated document
      - _Requirements: 5.3_

    - `PATCH /admin/properties/:propertyId/documents/:documentId/reject` - Reject document
      - Middleware: auth, rbac(ADMIN)
      - Body: { rejectionReason: string }
      - Call PropertyDocumentService.rejectDocument()
      - Return updated document
      - _Requirements: 3.1, 3.2, 5.3_

    - `GET /admin/properties/approval-status/:propertyId` - Get approval status
      - Middleware: auth, rbac(ADMIN)
      - Call PropertyApprovalService.getPropertyApprovalStatus()
      - Return status
      - _Requirements: 5.1, 5.5_

  - [x] 5.2 Register routes in `backend/src/index.ts`
    - Import and use propertyDocuments routes
    - _Requirements: All_

- [x] 6. Zod validation schemas
  - [x] 6.1 Add to `backend/src/schemas/property.schemas.ts` (or create new file)
    - `uploadDocumentSchema`: propertyId (positive int), documentType (enum), file (handled by multer)
    - `rejectDocumentSchema`: rejectionReason (string, min 10 chars)
    - `approveDocumentSchema`: empty or minimal
    - _Requirements: 1.1, 3.1_

- [x] 7. Notification types
  - [x] 7.1 Update `backend/src/services/notification.service.ts`
    - Add handlers for DOCUMENT_UPLOADED, DOCUMENT_APPROVED, DOCUMENT_REJECTED, PROPERTY_APPROVED
    - _Requirements: 1.8, 2.4, 3.2_

- [x] 8. Unit tests
  - [x] 8.1 Create `backend/src/__tests__/services/propertyDocument.test.ts`
    - Test uploadDocument: valid upload, unauthorized user, oversized file, invalid MIME type, duplicate document type, approved property
    - Test checkAllDocumentsUploaded: all documents present, missing document type, all rejected
    - Test rejectDocument: valid rejection, short reason, document not found
    - Test deleteDocument: owner deletion, non-owner deletion, approved document deletion
    - _Requirements: 1.1-1.8, 2.1-2.4, 3.1-3.3, 4.1-4.3_

  - [ ]* 8.2 Write property test for document upload validation (Property 1, Property 2, Property 4, Property 5, Property 6)
    - **Property 1: Invalid document types are always rejected**
    - **Property 2: Unauthorized users cannot upload documents**
    - **Property 4: Duplicate document types are always rejected**
    - **Property 5: Oversized files are always rejected**
    - **Property 6: Invalid MIME types are always rejected**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 1.6**

  - [ ]* 8.3 Write property test for document status checks (Property 9, Property 10, Property 11)
    - **Property 9: All required documents must be present for approval**
    - **Property 10: Rejected documents block property approval**
    - **Property 11: Missing documents block property approval**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 8.4 Write property test for document rejection (Property 13, Property 14, Property 15)
    - **Property 13: Document rejection requires valid reason**
    - **Property 14: Document rejection always triggers notification**
    - **Property 15: Rejected documents can be re-uploaded**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 8.5 Write property test for document deletion (Property 16, Property 17, Property 18)
    - **Property 16: Only owners can delete documents**
    - **Property 17: Approved documents cannot be deleted**
    - **Property 18: Deletion removes file from storage**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 9. Integration tests
  - [x] 9.1 Create `backend/src/__tests__/integration/propertyDocuments.integration.test.ts`
    - Test complete workflow: owner creates property → uploads all documents → admin approves
    - Test rejection workflow: owner uploads → admin rejects → owner re-uploads → admin approves
    - Test deletion workflow: owner uploads → deletes → uploads new one
    - Test approval blocking: admin cannot approve with missing documents
    - _Requirements: All_

- [x] 10. Frontend integration (optional for this spec)
  - [x] 10.1 Create document upload UI component
    - File input with drag-and-drop
    - Document type selector
    - Progress indicator
    - Error handling
    - _Requirements: 1.1-1.8_

  - [x] 10.2 Create admin document review panel
    - List pending documents
    - View document details
    - Approve/reject buttons
    - Rejection reason input
    - _Requirements: 5.1-5.5_

- [ ] 11. Documentation
  - [ ] 11.1 Update API documentation with new endpoints
  - [ ] 11.2 Add deployment notes for file storage configuration
  - [ ] 11.3 Document file cleanup and maintenance procedures
