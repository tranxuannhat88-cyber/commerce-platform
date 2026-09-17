import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    case '.avif':
      return 'image/avif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  try {
    const { file } = await params;
    const requestedPath = (file || []).join('/');
    const baseName = path.basename(requestedPath);

    // 1. Check in-memory shared cache
    const cache: Map<string, { buffer: Buffer; contentType: string }> | undefined =
      (globalThis as any).__COMMERCE_MEDIA_CACHE__;
    if (cache) {
      const entry = cache.get(baseName) || cache.get(requestedPath);
      if (entry) {
        return new NextResponse(new Uint8Array(entry.buffer), {
          status: 200,
          headers: {
            'Content-Type': entry.contentType || getMimeType(baseName),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    // 2. Check public/uploads
    const publicPath = path.join(process.cwd(), 'public', 'uploads', baseName);
    if (fs.existsSync(publicPath)) {
      const buffer = fs.readFileSync(publicPath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': getMimeType(baseName),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 3. Check os.tmpdir()/commerce-uploads
    const tmpPath = path.join(os.tmpdir(), 'commerce-uploads', baseName);
    if (fs.existsSync(tmpPath)) {
      const buffer = fs.readFileSync(tmpPath);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': getMimeType(baseName),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return NextResponse.json({ error: 'Tệp không tồn tại' }, { status: 404 });
  } catch (err: any) {
    console.error('Error serving upload file:', err);
    return NextResponse.json({ error: 'Lỗi tải tệp' }, { status: 500 });
  }
}
