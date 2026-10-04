import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  propertyId: z.number().int().positive('Property ID must be a positive integer'),
  documentType: z.enum(
    ['UPI', 'LAND_TITLE', 'LAND_CERTIFICATE', 'CERTIFICATE_OF_LAND_REGISTRATION'],
    {
      errorMap: () => ({
        message: 'Invalid document type. Must be one of: UPI, LAND_TITLE, LAND_CERTIFICATE, CERTIFICATE_OF_LAND_REGISTRATION',
      }),
    }
  ),
  // file is handled by multer middleware
});

export const rejectDocumentSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(1000, 'Rejection reason must not exceed 1000 characters'),
});

export const approveDocumentSchema = z.object({});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;
export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>;
