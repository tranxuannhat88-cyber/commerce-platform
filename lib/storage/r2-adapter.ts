// Cloudflare R2 / S3-compatible Storage Adapter
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProvider,
  PresignedUploadResult,
  PresignedDownloadResult,
  ObjectMetadata,
} from './types';
import { STORAGE_CONFIG } from './config';
import { StorageProviderType } from '@/types';

export class R2StorageAdapter implements StorageProvider {
  readonly providerType: StorageProviderType = 'CLOUDFLARE_R2';
  private s3Client: S3Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const { accountId, accessKeyId, secretAccessKey, endpoint } = STORAGE_CONFIG.r2;
    if (accessKeyId && secretAccessKey && (endpoint || accountId)) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
    }
  }

  async createUploadUrl(params: {
    bucket: string;
    object_key: string;
    content_type: string;
    content_length: number;
    expires_in_seconds?: number;
    acl?: 'public-read' | 'private';
  }): Promise<PresignedUploadResult> {
    const expiresIn = params.expires_in_seconds || STORAGE_CONFIG.signedUrlExpiry.uploadIntent;
    const assetId = params.object_key.split('/').slice(-2, -1)[0] || `ast_${Date.now()}`;

    if (!this.isConfigured || !this.s3Client) {
      // Mock / Offline Presigned URL simulation
      const mockUploadUrl = `/api/media/mock-upload?bucket=${encodeURIComponent(params.bucket)}&key=${encodeURIComponent(params.object_key)}`;
      return {
        upload_url: mockUploadUrl,
        asset_id: assetId,
        object_key: params.object_key,
        bucket: params.bucket,
        expires_in_seconds: expiresIn,
        headers: {
          'Content-Type': params.content_type,
        },
      };
    }

    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.object_key,
      ContentType: params.content_type,
      ContentLength: params.content_length,
      ...(params.acl === 'public-read' ? { ACL: 'public-read' } : {}),
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return {
      upload_url: uploadUrl,
      asset_id: assetId,
      object_key: params.object_key,
      bucket: params.bucket,
      expires_in_seconds: expiresIn,
      headers: {
        'Content-Type': params.content_type,
      },
    };
  }

  async createDownloadUrl(params: {
    bucket: string;
    object_key: string;
    expires_in_seconds?: number;
    response_content_disposition?: string;
  }): Promise<PresignedDownloadResult> {
    const expiresIn = params.expires_in_seconds || STORAGE_CONFIG.signedUrlExpiry.privateDownload;

    if (!this.isConfigured || !this.s3Client) {
      return {
        download_url: `/api/media/mock-download?bucket=${encodeURIComponent(params.bucket)}&key=${encodeURIComponent(params.object_key)}`,
        expires_in_seconds: expiresIn,
      };
    }

    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.object_key,
      ResponseContentDisposition: params.response_content_disposition,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return {
      download_url: downloadUrl,
      expires_in_seconds: expiresIn,
    };
  }

  async deleteObject(params: { bucket: string; object_key: string }): Promise<void> {
    if (!this.isConfigured || !this.s3Client) return;

    const command = new DeleteObjectCommand({
      Bucket: params.bucket,
      Key: params.object_key,
    });

    await this.s3Client.send(command);
  }

  async copyObject(params: {
    source_bucket: string;
    source_key: string;
    target_bucket: string;
    target_key: string;
  }): Promise<void> {
    if (!this.isConfigured || !this.s3Client) return;

    const command = new CopyObjectCommand({
      CopySource: `${params.source_bucket}/${params.source_key}`,
      Bucket: params.target_bucket,
      Key: params.target_key,
    });

    await this.s3Client.send(command);
  }

  async getMetadata(params: { bucket: string; object_key: string }): Promise<ObjectMetadata> {
    if (!this.isConfigured || !this.s3Client) {
      return {
        content_type: 'application/octet-stream',
        content_length: 1024,
        last_modified: new Date(),
      };
    }

    const command = new HeadObjectCommand({
      Bucket: params.bucket,
      Key: params.object_key,
    });

    const res = await this.s3Client.send(command);
    return {
      content_type: res.ContentType || 'application/octet-stream',
      content_length: res.ContentLength || 0,
      etag: res.ETag,
      last_modified: res.LastModified,
      custom_metadata: res.Metadata,
    };
  }

  async objectExists(params: { bucket: string; object_key: string }): Promise<boolean> {
    if (!this.isConfigured || !this.s3Client) return true;

    try {
      await this.getMetadata(params);
      return true;
    } catch {
      return false;
    }
  }

  async getObjectHash(params: { bucket: string; object_key: string }): Promise<string> {
    // Generate placeholder SHA-256 for audit
    return `sha256_${Date.now().toString(16)}_${params.object_key.slice(-8)}`;
  }
}

// Global Singleton Storage Adapter
let storageInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    storageInstance = new R2StorageAdapter();
  }
  return storageInstance;
}
