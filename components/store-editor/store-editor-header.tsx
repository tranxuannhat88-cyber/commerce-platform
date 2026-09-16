"use client";

import React from "react";
import Link from "next/link";
import { Monitor, Smartphone, Share2, ExternalLink } from "lucide-react";
import { PreviewDevice } from "./types";

interface StoreEditorHeaderProps {
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  onShare: () => void;
  publicStoreUrl: string;
}

export function StoreEditorHeader({
  previewDevice,
  onDeviceChange,
  onShare,
  publicStoreUrl,
}: StoreEditorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Left Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
          Cửa hàng của tôi
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          Xem trước giao diện cửa hàng của bạn như khách hàng sẽ nhìn thấy.
        </p>
      </div>

      {/* Center Device Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 self-start md:self-center shadow-2xs">
        <button
          type="button"
          onClick={() => onDeviceChange("DESKTOP")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            previewDevice === "DESKTOP"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/60 dark:border-neutral-700"
              : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-[#00B894]" />
          <span>Máy tính (Desktop)</span>
        </button>
        <button
          type="button"
          onClick={() => onDeviceChange("MOBILE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            previewDevice === "MOBILE"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/60 dark:border-neutral-700"
              : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00B894]" />
          <span>Di động (Mobile)</span>
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors shadow-2xs cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
          <span>Chia sẻ</span>
        </button>
        <Link
          href={publicStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white transition-all shadow-xs"
        >
          <span>Mở trang công khai</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}