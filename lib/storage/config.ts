// Storage Configuration & Policy Rules

export const STORAGE_CONFIG = {
  // Cloudflare R2 / S3 Config from Environment
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : ''),
    publicBucket: process.env.R2_PUBLIC_BUCKET || 'commerce-public-media',
    privateBucket: process.env.R2_PRIVATE_BUCKET || 'commerce-private-documents',
    evidenceBucket: process.env.R2_TRANSACTION_BUCKET || 'commerce-transaction-evidence',
    tempBucket: process.env.R2_TEMP_BUCKET || 'commerce-temp-uploads',
  },

  // CDN Public Domain
  cdn: {
    publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL || 'https://cdn.commerce2k.vn',
  },

  // Plan Quotas (in Bytes)
  quotas: {
    FREE: 1 * 1024 * 1024 * 1024, // 1 GB
    PRO: 10 * 1024 * 1024 * 1024, // 10 GB
    BUSINESS: 50 * 1024 * 1024 * 1024, // 50 GB
    ENTERPRISE: 500 * 1024 * 1024 * 1024, // 500 GB
  },

  // File Size Limits (in Bytes)
  sizeLimits: {
    PRODUCT_IMAGE_MAX: 15 * 1024 * 1024, // 15 MB
    DOCUMENT_MAX: 50 * 1024 * 1024, // 50 MB
    DRAWING_CAD_MAX: 100 * 1024 * 1024, // 100 MB
    TRANSACTION_EVIDENCE_MAX: 50 * 1024 * 1024, // 50 MB
  },

  // Allowed MIME Types
  allowedMimes: {
    publicImages: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
    ],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'text/plain',
      'text/csv',
    ],
    technicalDrawings: [
      'application/acad',
      'application/x-acad',
      'application/autocad_dwg',
      'image/vnd.dwg',
      'image/x-dwg',
      'application/dxf',
      'image/vnd.dxf',
    ],
  },

  // URL Expiry Defaults (in Seconds)
  signedUrlExpiry: {
    uploadIntent: 900, // 15 minutes
    privateDownload: 900, // 15 minutes
    transactionEvidenceDownload: 3600, // 1 hour
  },

  // Retention Period for Cleanup
  retention: {
    tempUploadsHours: 24,
    softDeletedDays: 30,
  },
};

export function isAllowedMimeType(mime: string, isTechnical: boolean = false): boolean {
  const normalized = mime.toLowerCase().trim();
  if (STORAGE_CONFIG.allowedMimes.publicImages.includes(normalized)) return true;
  if (STORAGE_CONFIG.allowedMimes.documents.includes(normalized)) return true;
  if (isTechnical && STORAGE_CONFIG.allowedMimes.technicalDrawings.includes(normalized)) return true;
  // Also allow generic extension detection if mime was octet-stream
  return false;
}

export function getSafeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
}
