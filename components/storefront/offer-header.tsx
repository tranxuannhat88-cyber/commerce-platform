"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Store as StoreIcon,
  Building2,
  User,
  Paperclip,
  FileDown,
  Globe,
  Clock,
  Package,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Offer, Store, Organization, StoreCustomizationSettings } from "@/types";
import { formatVND } from "@/lib/utils";

interface OfferHeaderProps {
  offer: Offer;
  store: Store;
  organization?: Organization | null;
  sellerType?: "PERSONAL" | "ORGANIZATION";
  sellerDisplayName?: string;
  sellerAvatarUrl?: string;
  isVerified?: boolean;
  publicLocation?: string;
  itemCount?: number;
  customization?: StoreCustomizationSettings;
  className?: string;
}

export function OfferHeader({
  offer,
  store,
  organization,
  sellerType = "ORGANIZATION",
  sellerDisplayName,
  sellerAvatarUrl,
  isVerified = false,
  publicLocation,
  itemCount = 0,
  customization,
  className = "",
}: OfferHeaderProps) {
  // Resolve Seller Identity
  const isOrg = sellerType === "ORGANIZATION" || Boolean(organization?.name);
  const resolvedDisplayName =
    sellerDisplayName ||
    (isOrg ? (organization?.name || store.store_name) : (store.store_name || "Nhà bán hàng cá nhân"));

  const resolvedLogoUrl =
    sellerAvatarUrl ||
    store.logo_url ||
    (isOrg ? organization?.logo_url : undefined);

  const storeSlug = store.slug || "auto";

  // Offer Type Label Resolution
  const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 0);
  const offerTypeLabel = isCatalog
    ? "DANH MỤC & BẢNG GIÁ"
    : offer.offer_type === "SERVICE"
    ? "DỊCH VỤ"
    : offer.offer_type === "PACKAGE"
    ? "COMBO ƯU ĐÃI"
    : "SẢN PHẨM & BÁO GIÁ";

  // Format Dates
  const updatedDate = offer.updated_at || offer.created_at;
  const formattedUpdate = updatedDate
    ? new Date(updatedDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const formattedExpiry = offer.expires_at
    ? new Date(offer.expires_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const isExpired = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();

  const brandColor = customization?.brand_color || "#2563eb";

  // Real attachments list
  const attachments = offer.attachments?.filter((a) => a && a.file_url) || [];

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs overflow-hidden ${className}`}
    >
      {/* 1. SELLER MINI PROFILE ROW */}
      <div className="p-4 sm:px-6 py-3.5 bg-neutral-50/70 dark:bg-neutral-800/40 border-b border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: Avatar, Name, Entity Type, Verified Badge, Public Location */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={resolvedDisplayName}
                className="w-10 h-10 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200/60 dark:border-blue-900/60">
                {isOrg ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
            )}

            {isVerified && (
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                title="Đã xác minh"
              >
                <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-xs sm:max-w-md">
                {resolvedDisplayName}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {isOrg ? "Tổ chức" : "Cá nhân"}
              </span>

              {isVerified && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Đã xác minh</span>
                  </span>
                </>
              )}

              {publicLocation && (
                <>
                  <span>•</span>
                  <span className="truncate">{publicLocation}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA View Store */}
        <Link
          href={`/${storeSlug}`}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all border border-neutral-200 dark:border-neutral-700 shadow-2xs self-start sm:self-center cursor-pointer"
        >
          <span>Xem cửa hàng</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
        </Link>
      </div>

      {/* 2. OFFER HERO CONTENT */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Category / Type & Expiry Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-2xs"
              style={{ backgroundColor: brandColor }}
            >
              {offerTypeLabel}
            </span>
          </div>

          {isExpired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offer đã kết thúc</span>
            </span>
          )}
        </div>

        {/* Offer Title (Primary H1) */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
          {offer.name}
        </h1>

        {/* Description (If exists) */}
        {(offer.short_description || offer.description) && (
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl line-clamp-3">
            {offer.short_description || offer.description}
          </p>
        )}

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-500 pt-1">
          {itemCount > 0 && (
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {itemCount} sản phẩm/dịch vụ
            </span>
          )}

          {itemCount > 0 && formattedUpdate && <span>•</span>}

          {formattedUpdate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Cập nhật {formattedUpdate}</span>
            </span>
          )}

          {formattedExpiry && !isExpired && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Hiệu lực đến {formattedExpiry}</span>
              </span>
            </>
          )}
        </div>

        {/* 3. ATTACHMENTS SECTION (Only rendered when actual files exist) */}
        {attachments.length > 0 && (
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
              <span>Tài liệu đính kèm ({attachments.length}):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.file_type !== "LINK"}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 hover:bg-blue-50 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-between text-xs transition-all text-neutral-800 dark:text-neutral-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {att.file_type === "LINK" ? (
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 truncate">
                      {att.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:underline shrink-0 ml-2">
                    {att.file_size || "Tải về"} ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
