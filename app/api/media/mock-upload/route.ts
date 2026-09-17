import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Global shared cache for media buffers across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __COMMERCE_MEDIA_CACHE__: Map<string, { buffer: Buffer; contentType: string }> | undefined;
}

if (!globalThis.__COMMERCE_MEDIA_CACHE__) {
  globalThis.__COMMERCE_MEDIA_CACHE__ = new Map();
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || `upload_${Date.now()}.png`;
    const filename = path.basename(key);
    const contentType = req.headers.get('content-type') || 'application/octet-stream';

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Store in global shared memory cache
    globalThis.__COMMERCE_MEDIA_CACHE__?.set(filename, { buffer, contentType });
    globalThis.__COMMERCE_MEDIA_CACHE__?.set(key, { buffer, contentType });

    // 2. Try writing to public/uploads (local development or persistent volume)
    let written = false;
    try {
      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }
      const publicFilePath = path.join(publicUploadsDir, filename);
      fs.writeFileSync(publicFilePath, buffer);
      written = true;
    } catch {
      // Expected on read-only serverless environments (e.g. Vercel)
    }

    // 3. Fallback to os.tmpdir() if public/uploads is read-only
    if (!written) {
      try {
        const tmpUploadsDir = path.join(os.tmpdir(), 'commerce-uploads');
        if (!fs.existsSync(tmpUploadsDir)) {
          fs.mkdirSync(tmpUploadsDir, { recursive: true });
        }
        const tmpFilePath = path.join(tmpUploadsDir, filename);
        fs.writeFileSync(tmpFilePath, buffer);
      } catch (tmpErr) {
        console.warn('Could not write to tmpdir, served via memory cache:', tmpErr);
      }
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        ETag: `"etag_${Date.now()}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Mock upload write error:', err);
    return NextResponse.json({ error: err.message || 'Lỗi lưu tệp tải lên' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-amz-acl',
    },
  });
}
