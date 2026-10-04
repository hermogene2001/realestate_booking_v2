import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../config/documentUpload';

// Get upload directory from environment or use default
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Create storage engine
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      cb(new Error('Property ID is required'), '');
      return;
    }

    const dir = path.join(UPLOAD_DIR, 'property-documents', propertyId.toString());
    
    // Create directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const documentType = req.body.documentType || 'document';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${documentType}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter to validate MIME types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  } else {
    cb(null, true);
  }
};

// Create multer instance
export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Error handler middleware for multer
export const handleDocumentUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File size exceeds maximum allowed (10MB)',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
      });
    }
  }

  if (err) {
    return res.status(400).json({
      error: err.message || 'File upload error',
    });
  }

  next();
};
