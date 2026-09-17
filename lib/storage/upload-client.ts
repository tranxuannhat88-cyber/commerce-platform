// Client-side media upload helper orchestrating presigned upload flow
export interface UploadMediaResult {
  assetId: string;
  url: string;
  objectKey: string;
}

export async function uploadMediaFile(
  file: File,
  options: {
    ownerType: 'STORE' | 'ORGANIZATION' | 'USER' | 'OFFER' | 'ORDER' | 'REQUEST';
    ownerId: string;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'AUTHORIZED_VIEWER';
    onProgress?: (percent: number) => void;
  }
): Promise<UploadMediaResult> {
  const { ownerType, ownerId, visibility = 'PUBLIC', onProgress } = options;

  onProgress?.(10);

  // 1. Request Presigned Upload Intent
  const intentRes = await fetch('/api/media/upload-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_type: ownerType,
      owner_id: ownerId,
      file_name: file.name,
      mime_type: file.type || 'image/png',
      file_size: file.size,
      visibility,
    }),
  });

  if (!intentRes.ok) {
    const err = await intentRes.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể khởi tạo phiên tải ảnh lên.');
  }

  const intent = await intentRes.json();
  onProgress?.(40);

  // 2. Direct-to-Storage PUT Upload
  const uploadRes = await fetch(intent.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text().catch(() => '');
    let errMsg = `Không thể tải tệp lên máy chủ lưu trữ (HTTP ${uploadRes.status})`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed.error) errMsg = `${errMsg}: ${parsed.error}`;
    } catch {
      if (errBody) errMsg = `${errMsg}: ${errBody.slice(0, 120)}`;
    }
    throw new Error(errMsg);
  }

  onProgress?.(80);

  // 3. Confirm Completion Callback
  const completeRes = await fetch('/api/media/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_id: intent.asset_id,
      upload_intent_token: intent.upload_intent_token,
      object_key: intent.object_key,
      bucket: intent.bucket,
      owner_type: ownerType,
      owner_id: ownerId,
      original_file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      visibility,
    }),
  });

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể xác nhận hoàn tất tải ảnh.');
  }

  const mediaAsset = await completeRes.json();
  onProgress?.(100);

  const finalUrl =
    mediaAsset.public_url ||
    (mediaAsset.object_key?.startsWith('http')
      ? mediaAsset.object_key
      : `/uploads/${mediaAsset.object_key?.split('/').pop()}`);

  return {
    assetId: mediaAsset.id,
    url: finalUrl,
    objectKey: mediaAsset.object_key,
  };
}
