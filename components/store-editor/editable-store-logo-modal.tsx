"use client";

import React, { useRef } from "react";
import { X, Upload, Trash2, Image as ImageIcon } from "lucide-react";

interface EditableStoreLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  storeName: string;
  brandColor: string;
  onSelectLogo: (url: string) => void;
  onDeleteLogo: () => void;
}

export function EditableStoreLogoModal({
  isOpen,
  onClose,
  currentLogoUrl,
  storeName,
  brandColor,
  onSelectLogo,
  onDeleteLogo,
}: EditableStoreLogoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const initials = (storeName || "Store")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước logo tối đa là 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onSelectLogo(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
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
          <div className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-center overflow-hidden">
            {currentLogoUrl ? (
              <img src={currentLogoUrl} alt={storeName} className="w-full h-full object-contain" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                style={{ backgroundColor: brandColor }}
              >
                {initials}
              </div>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-medium">
            {currentLogoUrl ? "Logo đang hiển thị" : "Chưa có logo (đang dùng chữ viết tắt)"}
          </p>
        </div>

        {/* File Input & Actions */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
        />

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Tải ảnh mới</span>
          </button>

          {currentLogoUrl && (
            <button
              type="button"
              onClick={() => {
                onDeleteLogo();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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