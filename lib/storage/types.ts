// Storage Provider Interface and Request/Response Models
import { MediaOwnerType, MediaVisibility, MediaAssetStatus, StorageProviderType } from '@/types';

export interface PresignedUploadResult {
  upload_url: string;
  asset_id: string;
  object_key: string;
  bucket: string;
  expires_in_seconds: number;
  headers?: Record<string, string>;
}

export interface PresignedDownloadResult {
  download_url: string;
  expires_in_seconds: number;
}

export interface ObjectMetadata {
  content_type: string;
  content_length: number;
  etag?: string;
  last_modified?: Date;
  sha256?: string;
  custom_metadata?: Record<string, string>;
}

export interface StorageProvider {
  readonly providerType: StorageProviderType;

  createUploadUrl(params: {
    bucket: string;
    object_key: string;
    content_type: string;
    content_length: number;
    expires_in_seconds?: number;
    acl?: 'public-read' | 'private';
  }): Promise<PresignedUploadResult>;

  createDownloadUrl(params: {
    bucket: string;
    object_key: string;
    expires_in_seconds?: number;
    response_content_disposition?: string;
  }): Promise<PresignedDownloadResult>;

  deleteObject(params: { bucket: string; object_key: string }): Promise<void>;

  copyObject(params: {
    source_bucket: string;
    source_key: string;
    target_bucket: string;
    target_key: string;
  }): Promise<void>;

  getMetadata(params: { bucket: string; object_key: string }): Promise<ObjectMetadata>;

  objectExists(params: { bucket: string; object_key: string }): Promise<boolean>;

  getObjectHash(params: { bucket: string; object_key: string }): Promise<string>;
}

export interface UploadIntentInput {
  organization_id?: string;
  owner_type: MediaOwnerType;
  owner_id?: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  visibility?: MediaVisibility;
  user_id?: string;
  guest_identity_id?: string;
}

export interface UploadIntentResponse {
  asset_id: string;
  upload_url: string;
  object_key: string;
  bucket: string;
  upload_intent_token: string;
  expires_in_seconds: number;
  headers?: Record<string, string>;
}

export interface UploadCompleteInput {
  asset_id: string;
  upload_intent_token: string;
  user_id?: string;
  guest_identity_id?: string;
}
