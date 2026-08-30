"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  QrCode,
  Share2,
  Phone,
  Mail,
  MapPin,
  Globe,
  ShoppingCart,
  Building2,
  ExternalLink,
} from "lucide-react";
import { PublicStorefrontDTO } from "@/lib/storefront/types";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";
import { useCart } from "./cart-drawer";

interface StoreHeaderProps {
  storefront: PublicStorefrontDTO;
}

export function StoreHeader({ storefront }: StoreHeaderProps) {
  const { setIsCartOpen, totalItems } = useCart();
  const [showQR, setShowQR] = useState(false);

  const storeUrl = typeof window !== "undefined" ? window.location.href : `/${storefront.slug}`;

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        {/* Cover Banner */}
        <div className="h-32 sm:h-48 w-full bg-linear-to-r from-blue-700 via-indigo-700 to-purple-800 relative overflow-hidden">
          {storefront.cover_image_url && (
            <img
              src={storefront.cover_image_url}
              alt={storefront.store_name}
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>

        {/* Brand Info & Action Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 relative -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Left: Logo & Details */}
            <div className="flex items-end gap-3.5 sm:gap-4">
              <div className="relative shrink-0">
                {storefront.logo_url ? (
                  <img
                    src={storefront.logo_url}
                    alt={storefront.store_name}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl object-cover bg-white dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl border-4 border-white dark:border-neutral-900 shadow-xl">
                    <Building2 className="w-10 h-10" />
                  </div>
                )}

                {storefront.seller_reputation.is_verified_business && (
                  <div
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md"
                    title="Doanh nghiệp Đã Xác Thực"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </div>

              <div className="space-y-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                    {storefront.store_name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    ✓ Verified Business
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {storefront.seller_reputation.rating_average.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-blue-600">
                    {storefront.seller_reputation.trust_score}/100 Uy tín
                  </span>
                  <span>•</span>
                  <span>{storefront.seller_reputation.completed_transactions} giao dịch</span>
                  {storefront.region && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {storefront.region}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-start sm:self-end">
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 transition-colors"
                title="Mã QR Cửa hàng"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <CopyButton text={storeUrl} label="Chia sẻ" className="py-2.5 rounded-2xl" />

              <Link
                href={`/seller/${storefront.slug}`}
                className="px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all"
              >
                Hồ Sơ
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Giỏ hàng</span>
                {totalItems > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white text-blue-700 rounded-full text-[10px] font-black">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Description & Contact Badges if enabled */}
          {storefront.description && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 pt-3 max-w-3xl leading-relaxed">
              {storefront.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 text-[11px] text-neutral-500">
            {storefront.public_contact_phone && (
              <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                {storefront.public_contact_phone}
              </span>
            )}
            {storefront.public_business_email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                {storefront.public_business_email}
              </span>
            )}
            {storefront.website_url && (
              <a
                href={storefront.website_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={storeUrl}
        title="Mã QR Cửa Hàng"
        subtitle={`Quét để mở trực tiếp ${storefront.store_name}`}
      />
    </>
  );
}
