import { NextRequest, NextResponse } from 'next/server';
import { getMediaUrlService } from '@/lib/storage/url-service';
import { MediaAsset } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket');
    const objectKey = searchParams.get('object_key');
    const fileName = searchParams.get('file_name') || 'downloaded_document';

    if (!bucket || !objectKey) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bucket hoặc object_key' },
        { status: 400 }
      );
    }

    const dummyAsset: MediaAsset = {
      id: 'asset_req',
      bucket,
      object_key: objectKey,
      original_file_name: fileName,
      mime_type: 'application/octet-stream',
      file_size: 0,
      file_extension: fileName.split('.').pop() || '',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      storage_provider: 'CLOUDFLARE_R2',
      owner_type: 'OTHER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const urlService = getMediaUrlService();
    const downloadUrl = await urlService.getPrivateDownloadUrl(dummyAsset, {
      custom_filename: fileName,
    });

    return NextResponse.json({ download_url: downloadUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Signed URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi cấp URL tải tệp riêng tư' },
      { status: 500 }
    );
  }
}
