"use client";

import { useState, useRef } from "react";
import { Upload, Camera, FileText, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from "lucide-react";
import { MediaAsset, MediaOwnerType, MediaVisibility } from "@/types";

interface MediaUploadDropzoneProps {
  ownerType: MediaOwnerType;
  ownerId?: string;
  visibility?: MediaVisibility;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  helperText?: string;
  allowCamera?: boolean;
  onUploadSuccess: (asset: MediaAsset) => void;
  className?: string;
}

export function MediaUploadDropzone({
  ownerType,
  ownerId,
  visibility = "PUBLIC",
  accept = "image/*,.pdf,.doc,.docx,.dwg,.dxf,.zip",
  maxSizeMb = 50,
  label = "Tải tệp lên Storage",
  helperText = "Hỗ trợ ảnh JPG/PNG/WebP, tài liệu PDF, bản vẽ CAD",
  allowCamera = true,
  onUploadSuccess,
  className = "",
}: MediaUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; sizeKb: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);

    // 1. Size Validation
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Dung lượng tệp (${Math.round(file.size / (1024 * 1024))}MB) vượt quá giới hạn ${maxSizeMb}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 2. Request Upload Intent
      const intentRes = await fetch("/api/media/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: ownerType,
          owner_id: ownerId,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          visibility,
        }),
      });

      if (!intentRes.ok) {
        const err = await intentRes.json();
        throw new Error(err.error || "Không thể khởi tạo phiên tải lên");
      }

      const intentData = await intentRes.json();
      setUploadProgress(40);

      // 3. Direct-to-Storage PUT Upload
      const uploadRes = await fetch(intentData.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Lỗi khi tải dữ liệu nhị phân trực tiếp lên Object Storage.");
      }

      setUploadProgress(80);

      // 4. Confirm Completion Callback
      const completeRes = await fetch("/api/media/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: intentData.asset_id,
          upload_intent_token: intentData.upload_intent_token,
          object_key: intentData.object_key,
          bucket: intentData.bucket,
          owner_type: ownerType,
          owner_id: ownerId,
          original_file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          visibility,
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Không thể xác nhận hoàn tất tải lên");
      }

      const mediaAsset: MediaAsset = await completeRes.json();
      setUploadProgress(100);
      setUploadedFile({ name: file.name, sizeKb: Math.round(file.size / 1024) });
      onUploadSuccess(mediaAsset);
    } catch (err: any) {
      console.error("Direct upload error:", err);
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình tải tệp.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleProcessFile(file);
        }}
        className={`relative p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-4 ring-blue-500/20"
            : "border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/40 hover:border-neutral-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleProcessFile(file);
          }}
          className="hidden"
        />

        {allowCamera && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProcessFile(file);
            }}
            className="hidden"
          />
        )}

        {isUploading ? (
          <div className="space-y-3 py-2 w-full max-w-xs text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Đang truyền tệp trực tiếp lên Cloudflare R2...
              </p>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                {uploadProgress}% hoàn tất
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{label}</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">{helperText}</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn từ thiết bị</span>
              </button>

              {allowCamera && (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chụp Camera</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Success Alert */}
      {uploadedFile && !isUploading && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold truncate">{uploadedFile.name}</span>
            <span className="text-[10px] text-emerald-600/80 shrink-0">({uploadedFile.sizeKb} KB)</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-200/60 dark:bg-emerald-900 px-2 py-0.5 rounded-full shrink-0">
            Đã lưu R2
          </span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
