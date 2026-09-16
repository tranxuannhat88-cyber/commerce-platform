"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store as StoreIcon,
  Sliders,
  Share2,
  ExternalLink,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { AppUrlService } from "@/lib/services/url";
import { QRModal } from "@/components/shared/qr-modal";
import { PublicStoreView } from "@/components/storefront/public/public-store-view";

type PreviewDevice = "DESKTOP" | "MOBILE";

export default function MyStorePage() {
  const { store } = useCommerceStore();
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("DESKTOP");
  const [showQR, setShowQR] = useState(false);

  const slug = store.slug || "invamax-workspace";
  const storeName = store.store_name || "INVAMAX workspace";
  const storeUrl = AppUrlService.getStoreUrl(slug);
  const logoUrl = store.logo_url || "";

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* SELLER-ONLY TOOLBAR (OUTSIDE STOREFRONT RENDERER) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              <StoreIcon className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                CỬA HÀNG CỦA TÔI
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tiếp (Live)</span>
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
              {storeName}
            </h1>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Đường dẫn: hinex.vn/s/{slug}
            </p>
          </div>
        </div>

        {/* Center: Device Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 self-start md:self-center">
          <button
            type="button"
            onClick={() => setPreviewDevice("DESKTOP")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewDevice === "DESKTOP"
                ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Máy tính (Desktop)</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("MOBILE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewDevice === "MOBILE"
                ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Di động (Mobile 390px)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/store-settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Chỉnh sửa cửa hàng</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Chia sẻ</span>
          </button>
          <Link
            href={`/s/${slug}`}
            target="_blank"
            title="Mở trang cửa hàng công khai trong tab mới"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <span>Mở trang công khai</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* LIVE STOREFRONT RENDERER CONTAINER */}
      {previewDevice === "DESKTOP" ? (
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs bg-white dark:bg-neutral-950">
          <PublicStoreView storeSlug={slug} />
        </div>
      ) : (
        <div className="flex justify-center py-6 bg-neutral-100/70 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800">
          <div className="w-[390px] max-w-full rounded-[40px] border-8 border-neutral-800 dark:border-neutral-700 shadow-2xl overflow-hidden bg-white dark:bg-neutral-950">
            {/* Simulated mobile speaker notch */}
            <div className="h-6 bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center">
              <div className="w-16 h-1 bg-neutral-600 rounded-full" />
            </div>
            <div className="max-h-[750px] overflow-y-auto">
              <PublicStoreView storeSlug={slug} />
            </div>
          </div>
        </div>
      )}

      {/* QR & Share Modal */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={storeUrl}
        title={storeName}
      />
    </div>
  );
}
