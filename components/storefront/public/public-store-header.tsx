"use client";

import React from "react";
import Link from "next/link";
import { Share2, ShoppingCart, Search, Store as StoreIcon } from "lucide-react";
import { useCart } from "@/components/storefront/cart-drawer";
import { AppUrlService } from "@/lib/services/url";

interface PublicStoreHeaderProps {
  storeName: string;
  storeSlug: string;
  brandColor?: string;
  onOpenSearch?: () => void;
}

export function PublicStoreHeader({
  storeName,
  storeSlug,
  brandColor = "#2563eb",
  onOpenSearch,
}: PublicStoreHeaderProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const storeUrl = AppUrlService.getStoreUrl(storeSlug);
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Ghé thăm cửa hàng trực tuyến của ${storeName} trên nền tảng Go`,
          url: storeUrl,
        });
        return;
      } catch {
        // User cancelled or share API not permitted -> fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Platform Logo & Store Anchor */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 hover:scale-105 transition-transform"
            title="Hinex - Nền tảng giao dịch số"
          >
            <img src="/icons/icon-192.png" alt="Hinex" className="w-full h-full object-cover" />
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700 select-none">/</span>
          <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
            {storeName}
          </span>
        </div>

        {/* Right: Actions (Search, Share, Cart) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              title="Tìm kiếm sản phẩm"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer relative"
            title="Chia sẻ cửa hàng"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-7 right-0 text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md whitespace-nowrap animate-in fade-in shadow-md">
                Đã copy link!
              </span>
            )}
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {totalItems > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-neutral-900 font-black text-[10px] flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
