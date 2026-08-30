import { NextRequest, NextResponse } from 'next/server';
import { getMediaStorageService } from '@/lib/storage/service';
import { UploadIntentInput } from '@/lib/storage/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadIntentInput;

    if (!body.file_name || !body.mime_type || !body.file_size || !body.owner_type) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc (file_name, mime_type, file_size, owner_type)' },
        { status: 400 }
      );
    }

    const service = getMediaStorageService();
    const result = await service.requestUploadIntent(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Upload intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi tạo phiên tải lên' },
      { status: 400 }
    );
  }
}
