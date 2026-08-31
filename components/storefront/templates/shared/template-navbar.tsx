"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  QrCode,
  Share2,
  Phone,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Store, Organization, StoreTemplate, StoreCustomizationSettings } from "@/types";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";
import { useCart } from "@/components/storefront/cart-drawer";

interface TemplateNavbarProps {
  store: Store;
  organization?: Organization;
  template: StoreTemplate;
  customization?: StoreCustomizationSettings;
  storeSlug: string;
}

export function TemplateNavbar({
  store,
  organization,
  template,
  customization,
  storeSlug,
}: TemplateNavbarProps) {
  const { setIsCartOpen, totalItems } = useCart();
  const [showQR, setShowQR] = useState(false);

  const brandColor = customization?.brand_color || template.design_tokens.color_palette_default.primary;
  const isOrg = store.owner_actor_type === "ORGANIZATION" || Boolean(organization?.name);
  const displayName = isOrg ? (organization?.name || store.store_name) : (store.store_name || "Nhà bán hàng");
  const isVerified = isOrg ? organization?.verification_status === "VERIFIED" : store.verification_status === "VERIFIED";
  const logoUrl = store.logo_url || organization?.logo_url;

  const storeUrl = typeof window !== "undefined" ? window.location.href : `/${storeSlug}`;

  // Specialized navbar styling per template
  const isDarkTech = template.code === "PREMIUM_DARK_TECH";
  const isLuxury = template.code === "PREMIUM_FLAGSHIP_LUXURY";
  const isMinimal = template.code === "FREE_MINIMAL";

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all backdrop-blur-md border-b ${
          isDarkTech
            ? "bg-black/90 border-cyan-500/30 text-white shadow-[0_4px_20px_rgba(6,182,212,0.1)]"
            : isLuxury
            ? "bg-neutral-950/95 border-amber-500/30 text-amber-100 shadow-xl"
            : isMinimal
            ? "bg-white/90 dark:bg-neutral-950/90 border-neutral-100 dark:border-neutral-800/60 text-neutral-900 dark:text-neutral-100"
            : "bg-white/90 dark:bg-neutral-900/90 border-neutral-200/90 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <Link href={`/${storeSlug}`} className="flex items-center gap-3 min-w-0 group cursor-pointer">
            <div className="relative shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover border ${
                    isDarkTech
                      ? "border-cyan-400 ring-2 ring-cyan-500/30"
                      : isLuxury
                      ? "border-amber-400/60 ring-2 ring-amber-500/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                />
              ) : (
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-white flex items-center justify-center font-bold text-xs shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  {isOrg ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
              )}

              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="font-bold text-xs sm:text-sm truncate group-hover:opacity-80 transition-opacity">
                  {displayName}
                </h1>
                {isVerified && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    ✓ Xác minh
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate hidden sm:block">
                {template.name} • {template.category}
              </p>
            </div>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="QR Cửa Hàng"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <CopyButton text={storeUrl} label="Chia sẻ" className="text-xs py-1.5 px-3 rounded-xl hidden sm:flex" />

            <Link
              href={`/seller/${storeSlug}`}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-colors hidden md:flex items-center gap-1"
            >
              <span>Hồ Sơ</span>
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90 active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-neutral-900 rounded-full text-[10px] font-black shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* QR Modal */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={storeUrl}
        title={displayName}
        subtitle="Quét mã QR để mở trang cửa hàng trên điện thoại"
      />
    </>
  );
}
