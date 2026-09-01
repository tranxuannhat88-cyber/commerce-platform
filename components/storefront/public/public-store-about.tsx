"use client";

import React from "react";
import { Info } from "lucide-react";

interface PublicStoreAboutProps {
  storeName: string;
  description?: string;
  brandColor?: string;
}

export function PublicStoreAbout({
  storeName,
  description,
  brandColor = "#2563eb",
}: PublicStoreAboutProps) {
  if (!description || !description.trim()) {
    return null;
  }

  return (
    <section className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4" style={{ color: brandColor }} />
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Về {storeName}
        </h3>
      </div>
      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </section>
  );
}
