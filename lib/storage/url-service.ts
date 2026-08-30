// Media URL & Secure Download Service
import { getStorageProvider } from './r2-adapter';
import { STORAGE_CONFIG } from './config';
import { MediaAsset, MediaVariant } from '@/types';

export class MediaUrlService {
  private provider = getStorageProvider();

  /**
   * Resolve Public CDN URL for public assets (Cached & Immutable)
   */
  getPublicMediaUrl(assetOrKey: { object_key: string } | string): string {
    const key = typeof assetOrKey === 'string' ? assetOrKey : assetOrKey.object_key;
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    return `${STORAGE_CONFIG.cdn.publicBaseUrl}/${key}`;
  }

  /**
   * Generate Temporary Signed Download URL for private documents/evidence
   */
  async getPrivateDownloadUrl(
    asset: MediaAsset,
    options?: {
      expires_in_seconds?: number;
      custom_filename?: string;
    }
  ): Promise<string> {
    const disposition = options?.custom_filename
      ? `attachment; filename="${encodeURIComponent(options.custom_filename)}"`
      : `attachment; filename="${encodeURIComponent(asset.original_file_name)}"`;

    const result = await this.provider.createDownloadUrl({
      bucket: asset.bucket,
      object_key: asset.object_key,
      expires_in_seconds: options?.expires_in_seconds || STORAGE_CONFIG.signedUrlExpiry.privateDownload,
      response_content_disposition: disposition,
    });

    return result.download_url;
  }

  /**
   * Resolve CDN URL for image derivatives / variants
   */
  getVariantUrl(asset: MediaAsset, variant?: MediaVariant | string): string {
    if (typeof variant === 'object' && variant?.object_key) {
      return this.getPublicMediaUrl(variant.object_key);
    }
    // Fallback to original public key
    return this.getPublicMediaUrl(asset.object_key);
  }
}

// Global Singleton
let mediaUrlService: MediaUrlService | null = null;

export function getMediaUrlService(): MediaUrlService {
  if (!mediaUrlService) {
    mediaUrlService = new MediaUrlService();
  }
  return mediaUrlService;
}
