"use client";

import React, { useRef, useState } from "react";
import { X, Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadMediaFile } from "@/lib/storage/upload-client";

interface EditableStoreLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  storeName: string;
  brandColor: string;
  storeId?: string;
  onSelectLogo: (url: string, assetId?: string) => Promise<void> | void;
  onDeleteLogo: () => Promise<void> | void;
}

export function EditableStoreLogoModal({
  isOpen,
  onClose,
  currentLogoUrl,
  storeName,
  brandColor,
  storeId = "store_invamax_workspace",
  onSelectLogo,
  onDeleteLogo,
}: EditableStoreLogoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  if (!isOpen) return null;

  const initials = (storeName || "Store")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước logo tối đa là 5MB");
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadMediaFile(file, {
        ownerType: "STORE",
        ownerId: storeId,
        visibility: "PUBLIC",
      });

      await onSelectLogo(result.url, result.assetId);
      onClose();
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setUploadError(err.message || "Ảnh đã tải lên nhưng chưa thể lưu vào cửa hàng. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(tempUrl);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await onDeleteLogo();
      onClose();
    } catch (err: any) {
      console.error("Delete logo error:", err);
      setUploadError(err.message || "Không thể xóa logo. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-sm w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00B894]/10 text-[#00B894] flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                LOGO CỬA HÀNG
              </h3>
              <p className="text-[11px] text-neutral-500">Chỉnh sửa trực tiếp logo hiển thị</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Preview */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center overflow-hidden relative">
            {previewUrl || currentLogoUrl ? (
              <img src={previewUrl || currentLogoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                style={{ backgroundColor: brandColor }}
              >
                {initials}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin text-[#00B894]" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-medium">
            {isUploading ? "Đang tải ảnh và lưu cửa hàng..." : (previewUrl || currentLogoUrl ? "Logo đang hiển thị" : "Chưa có logo (đang dùng chữ viết tắt)")}
          </p>
        </div>

        {uploadError && (
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
            {uploadError}
          </div>
        )}

        {/* File Input & Actions */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-[#00B894] hover:bg-[#00a884] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải lên...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Tải ảnh mới</span>
              </>
            )}
          </button>

          {(currentLogoUrl || previewUrl) && (
            <button
              type="button"
              disabled={isUploading}
              onClick={handleDelete}
              className="w-full py-2.5 rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa logo</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
          Định dạng hỗ trợ: PNG, JPG, WebP (tối đa 5 MB)
          <br />
          Tỷ lệ khuyến nghị: 1:1 (vuông)
        </p>
      </div>
    </div>
  );
}