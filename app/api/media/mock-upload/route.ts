import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  // In mock mode, simply accept the binary stream and return 200 with mock ETag
  return new NextResponse(null, {
    status: 200,
    headers: {
      ETag: `"mock_etag_${Date.now()}"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
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
