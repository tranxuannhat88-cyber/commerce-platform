"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface PublicStoreFooterProps {
  storeName: string;
}

export function PublicStoreFooter({ storeName }: PublicStoreFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 py-8 border-t border-neutral-200/80 dark:border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
      <div className="flex items-center justify-center gap-1.5 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>Cửa hàng vận hành trên nền tảng thương mại trực tuyến Go</span>
      </div>
      <p>© {currentYear} {storeName}. Mọi quyền được bảo lưu.</p>
    </footer>
  );
}
