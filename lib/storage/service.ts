// High-Level Media Storage Service Orchestrator
import { getStorageProvider } from './r2-adapter';
import { STORAGE_CONFIG, isAllowedMimeType, getSafeFileName } from './config';
import {
  UploadIntentInput,
  UploadIntentResponse,
  UploadCompleteInput,
} from './types';
import { MediaAsset, MediaVisibility, MediaOwnerType } from '@/types';

export class MediaStorageService {
  private provider = getStorageProvider();

  /**
   * Request Presigned Upload Intent
   */
  async requestUploadIntent(input: UploadIntentInput): Promise<UploadIntentResponse> {
    const {
      organization_id = 'org_default',
      owner_type,
      owner_id = 'generic',
      file_name,
      mime_type,
      file_size,
      visibility = 'PUBLIC',
      user_id,
      guest_identity_id,
    } = input;

    // 1. Validate MIME Type
    const isDrawing = owner_type === 'REQUEST' || file_name.endsWith('.dwg') || file_name.endsWith('.dxf');
    if (!isAllowedMimeType(mime_type, isDrawing)) {
      throw new Error(`Định dạng tệp không được hỗ trợ: ${mime_type}`);
    }

    // 2. Validate File Size
    let maxAllowed = STORAGE_CONFIG.sizeLimits.DOCUMENT_MAX;
    if (visibility === 'PUBLIC' && mime_type.startsWith('image/')) {
      maxAllowed = STORAGE_CONFIG.sizeLimits.PRODUCT_IMAGE_MAX;
    } else if (isDrawing) {
      maxAllowed = STORAGE_CONFIG.sizeLimits.DRAWING_CAD_MAX;
    }

    if (file_size > maxAllowed) {
      const maxMb = Math.round(maxAllowed / (1024 * 1024));
      throw new Error(`Dung lượng tệp (${Math.round(file_size / (1024 * 1024))} MB) vượt quá giới hạn cho phép (${maxMb} MB)`);
    }

    // 3. Resolve Target Bucket & ACL
    let targetBucket = STORAGE_CONFIG.r2.publicBucket;
    let acl: 'public-read' | 'private' = 'public-read';

    if (visibility === 'PRIVATE' || visibility === 'AUTHORIZED_VIEWER') {
      targetBucket = STORAGE_CONFIG.r2.privateBucket;
      acl = 'private';
    } else if (visibility === 'TRANSACTION_EVIDENCE') {
      targetBucket = STORAGE_CONFIG.r2.evidenceBucket;
      acl = 'private';
    }

    // 4. Generate Deterministic Object Key
    const assetId = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const safeName = getSafeFileName(file_name);
    
    let objectKey = `organizations/${organization_id}/${owner_type.toLowerCase()}/${owner_id}/${assetId}/${safeName}`;
    if (guest_identity_id && !user_id) {
      objectKey = `guests/${guest_identity_id}/${owner_type.toLowerCase()}/${assetId}/${safeName}`;
    }

    // 5. Generate Pre-signed Upload URL
    const presigned = await this.provider.createUploadUrl({
      bucket: targetBucket,
      object_key: objectKey,
      content_type: mime_type,
      content_length: file_size,
      acl,
      expires_in_seconds: STORAGE_CONFIG.signedUrlExpiry.uploadIntent,
    });

    const uploadIntentToken = `tok_${assetId}_${Date.now()}`;

    return {
      asset_id: assetId,
      upload_url: presigned.upload_url,
      object_key: objectKey,
      bucket: targetBucket,
      upload_intent_token: uploadIntentToken,
      expires_in_seconds: presigned.expires_in_seconds,
      headers: presigned.headers,
    };
  }

  /**
   * Complete Upload Callback & Validation
   */
  async completeUpload(input: UploadCompleteInput & {
    organization_id?: string;
    owner_type: MediaOwnerType;
    owner_id?: string;
    original_file_name: string;
    mime_type: string;
    file_size: number;
    object_key: string;
    bucket: string;
    visibility: MediaVisibility;
  }): Promise<MediaAsset> {
    const {
      asset_id,
      organization_id = 'org_default',
      owner_type,
      owner_id,
      original_file_name,
      mime_type,
      file_size,
      object_key,
      bucket,
      visibility,
      user_id,
      guest_identity_id,
      upload_intent_token,
    } = input;

    // 1. Verify Object Exists in Storage
    const exists = await this.provider.objectExists({ bucket, object_key });
    if (!exists) {
      throw new Error('Tệp tải lên không tồn tại trong Storage hoặc đã bị hủy.');
    }

    // 2. Compute SHA-256 if Transaction Evidence
    let sha256Hash: string | undefined = undefined;
    let hashedAt: string | undefined = undefined;

    if (visibility === 'TRANSACTION_EVIDENCE') {
      sha256Hash = await this.provider.getObjectHash({ bucket, object_key });
      hashedAt = new Date().toISOString();
    }

    const fileExt = original_file_name.split('.').pop() || 'bin';

    // 3. Create MediaAsset Record
    const mediaAsset: MediaAsset = {
      id: asset_id,
      organization_id,
      owner_type,
      owner_id,
      storage_provider: this.provider.providerType,
      bucket,
      object_key,
      original_file_name,
      mime_type,
      file_size,
      file_extension: fileExt,
      visibility,
      status: 'ACTIVE',
      sha256_hash: sha256Hash,
      hash_algorithm: sha256Hash ? 'SHA-256' : undefined,
      hashed_at: hashedAt,
      uploaded_by_user_id: user_id,
      uploaded_by_guest_identity_id: guest_identity_id,
      upload_intent_token,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return mediaAsset;
  }
}

// Global Singleton Service
let mediaStorageService: MediaStorageService | null = null;

export function getMediaStorageService(): MediaStorageService {
  if (!mediaStorageService) {
    mediaStorageService = new MediaStorageService();
  }
  return mediaStorageService;
}
