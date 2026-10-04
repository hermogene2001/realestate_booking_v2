// Document upload configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'UPI',
  'LAND_TITLE',
  'LAND_CERTIFICATE',
  'CERTIFICATE_OF_LAND_REGISTRATION',
];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  UPI: 'Unique Property Identifier',
  LAND_TITLE: 'Land Title',
  LAND_CERTIFICATE: 'Land Certificate',
  CERTIFICATE_OF_LAND_REGISTRATION: 'Certificate of Land Registration',
};
