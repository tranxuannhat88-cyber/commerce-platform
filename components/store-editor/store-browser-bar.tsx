"use client";

import React from "react";
import { Lock } from "lucide-react";

interface StoreBrowserBarProps {
  storeUrl: string;
  templateName: string;
  isPremium?: boolean;
  onChangeTemplate: () => void;
}

export function StoreBrowserBar({
  storeUrl,
  templateName,
  isPremium = false,
  onChangeTemplate,
}: StoreBrowserBarProps) {
  return (
    <div className="bg-neutral-100/90 dark:bg-neutral-900/90 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Left: 3 Browser Dots + Compact URL Bar */}
      <div className="flex items-center gap-3 flex-1 min-w-[260px]">
        <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/90 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90 inline-block" />
        </div>

        <div className="flex-1 max-w-md bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 rounded-xl px-3 py-1 flex items-center gap-1.5 shadow-2xs text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate">
          <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">{storeUrl}</span>
        </div>
      </div>

      {/* Right: Active Template & Change Button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <span>Đang hiển thị mẫu: </span>
          <span className="font-bold text-[#00B894] dark:text-[#00D1A7]">
            {templateName} {isPremium ? "(Cao cấp)" : "(Miễn phí)"}
          </span>
        </div>
        <button
          type="button"
          onClick={onChangeTemplate}
          className="px-3 py-1 text-xs font-bold rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 transition-colors shadow-2xs cursor-pointer"
        >
          Thay đổi mẫu
        </button>
      </div>
    </div>
  );
}