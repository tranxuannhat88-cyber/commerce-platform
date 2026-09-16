"use client";

import React, { useRef } from "react";
import { X, Upload, Trash2, Camera } from "lucide-react";

interface EditableStoreBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string;
  storeName: string;
  brandColor: string;
  accentColor: string;
  onSelectBanner: (url: string) => void;
  onDeleteBanner: () => void;
}

export function EditableStoreBannerModal({
  isOpen,
  onClose,
  currentBannerUrl,
  storeName,
  brandColor,
  accentColor,
  onSelectBanner,
  onDeleteBanner,
}: EditableStoreBannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước ảnh bìa tối đa là 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onSelectBanner(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00B894]/10 text-[#00B894] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                ẢNH BÌA CỬA HÀNG
              </h3>
              <p className="text-[11px] text-neutral-500">Chỉnh sửa trực tiếp banner hiển thị</p>
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

        {/* Current Banner Preview */}
        <div className="space-y-2">
          <div className="w-full h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden relative">
            {currentBannerUrl ? (
              <img src={currentBannerUrl} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-neutral-500 font-bold text-xs"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}22 0%, ${accentColor}44 100%)`,
                }}
              >
                Mẫu nền mặc định (Chưa có ảnh bìa)
              </div>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 font-medium">
            {currentBannerUrl ? "Ảnh bìa đang hiển thị" : "Hệ thống đang dùng dải màu mặc định theo mẫu"}
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

          {currentBannerUrl && (
            <button
              type="button"
              onClick={() => {
                onDeleteBanner();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa ảnh bìa (dùng nền mặc định)</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
          Định dạng hỗ trợ: PNG, JPG, WebP (tối đa 10 MB)
          <br />
          Kích thước khuyến nghị: 1920 × 600
        </p>
      </div>
    </div>
  );
}