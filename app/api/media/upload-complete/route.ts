import { NextRequest, NextResponse } from 'next/server';
import { getMediaStorageService } from '@/lib/storage/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.asset_id || !body.upload_intent_token || !body.object_key || !body.bucket) {
      return NextResponse.json(
        { error: 'Thiếu thông tin xác thực tải lên (asset_id, upload_intent_token, object_key, bucket)' },
        { status: 400 }
      );
    }

    const service = getMediaStorageService();
    const mediaAsset = await service.completeUpload(body);

    return NextResponse.json(mediaAsset, { status: 200 });
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi xác nhận hoàn tất tải lên' },
      { status: 400 }
    );
  }
}
