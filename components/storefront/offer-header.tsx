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
  ExternalLink,
} from "lucide-react";
import { Offer, Store, Organization, PersonalActor, StoreCustomizationSettings } from "@/types";
import { UserIdentity } from "@/lib/auth/types";
import { STORE_TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/templates/definitions";
import { formatVND } from "@/lib/utils";

interface OfferHeaderProps {
  offer: Offer;
  store: Store;
  organization?: Organization | null;
  personalActor?: PersonalActor | null;
  user?: UserIdentity | null;
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
  personalActor,
  user,
  sellerType,
  sellerDisplayName,
  sellerAvatarUrl,
  isVerified = false,
  publicLocation,
  itemCount = 0,
  customization,
  className = "",
}: OfferHeaderProps) {
  // 1. Resolve Active Template & Theme Styling
  const activeTemplateId = store.active_template_id || DEFAULT_TEMPLATE_ID;
  const activeTemplate = STORE_TEMPLATES.find((t) => t.id === activeTemplateId) || STORE_TEMPLATES[0];

  const brandColor =
    customization?.brand_color ||
    store.customization?.brand_color ||
    activeTemplate?.design_tokens.color_palette_default.primary ||
    "#10b981";

  const accentColor =
    customization?.accent_color ||
    store.customization?.accent_color ||
    activeTemplate?.design_tokens.color_palette_default.accent ||
    "#059669";

  const templateCode = activeTemplate?.code || "FREE_MODERN";
  const isLuxury = templateCode === "PREMIUM_FLAGSHIP_LUXURY";
  const isDarkTech = templateCode === "PREMIUM_DARK_TECH";

  // 2. Resolve Seller Identity (Account Name / Org Name / Store Name)
  const rawAccount = (user?.full_name || personalActor?.display_name || "").replace(/\s*\(Cá nhân\)\s*/gi, "").trim();
  const accountName = rawAccount.toLowerCase() === "cá nhân" ? "" : rawAccount;
  const orgName = (organization?.name && organization.name !== "Chưa có tổ chức" ? organization.name : "").trim();
  const storeName = (store.store_name && store.store_name !== "auto" && store.store_name !== "Cửa Hàng Trực Tuyến" ? store.store_name : "").trim();

  const isOrg = sellerType === "ORGANIZATION" || Boolean(orgName) || store.owner_actor_type === "ORGANIZATION";

  // Build the formatted display name according to rules:
  // - For Personal: AccountName / StoreName (or 1 name if identical or only 1 exists)
  // - For Org: OrgName / StoreName (or 1 name if identical or only 1 exists)
  let resolvedName = sellerDisplayName || "";
  if (!resolvedName || resolvedName.toLowerCase() === "cá nhân (cá nhân)" || resolvedName.toLowerCase() === "cá nhân (cá nhân) / cá nhân" || resolvedName.toLowerCase() === "cá nhân") {
    if (isOrg) {
      if (orgName && storeName && orgName.toLowerCase() !== storeName.toLowerCase()) {
        resolvedName = `${orgName} / ${storeName}`;
      } else {
        resolvedName = orgName || storeName || "Tổ chức bán hàng";
      }
    } else {
      if (accountName && storeName && accountName.toLowerCase() !== storeName.toLowerCase()) {
        resolvedName = `${accountName} / ${storeName}`;
      } else {
        resolvedName = accountName || storeName || "Nhà bán hàng cá nhân";
      }
    }
  }

  // 3. Resolve Avatar: Store Logo -> Org Logo -> Account Avatar -> Fallback Icon
  const resolvedAvatarUrl =
    sellerAvatarUrl ||
    store.logo_url ||
    (isOrg ? organization?.logo_url : (personalActor?.avatar_url || user?.avatar_url));

  // Store Link Target (Always navigates to valid store link)
  const storeSlug = store.slug && store.slug !== "auto" ? store.slug : "store";

  // 4. Offer Type Label Resolution
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

  const isExpired = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();

  // Dynamic Template-Adaptive Background & Colors
  const containerStyle: React.CSSProperties = isLuxury
    ? {
        background: "radial-gradient(ellipse at top left, #261f14 0%, #0c0a09 100%)",
        borderColor: "rgba(245, 158, 11, 0.35)",
        color: "#fef3c7",
      }
    : isDarkTech
    ? {
        background: "radial-gradient(ellipse at top left, #082f49 0%, #030712 100%)",
        borderColor: "rgba(6, 182, 212, 0.35)",
        color: "#ecfeff",
      }
    : {
        background: `linear-gradient(180deg, ${brandColor}18 0%, ${brandColor}06 45%, #ffffff 100%)`,
        borderColor: `${brandColor}35`,
      };

  const topBarStyle: React.CSSProperties = isLuxury
    ? {
        backgroundColor: "rgba(17, 14, 9, 0.75)",
        borderBottomColor: "rgba(245, 158, 11, 0.25)",
      }
    : isDarkTech
    ? {
        backgroundColor: "rgba(3, 15, 23, 0.75)",
        borderBottomColor: "rgba(6, 182, 212, 0.25)",
      }
    : {
        backgroundColor: `${brandColor}12`,
        borderBottomColor: `${brandColor}25`,
      };

  return (
    <div
      style={containerStyle}
      className={`rounded-3xl border shadow-md overflow-hidden transition-all text-neutral-900 dark:text-neutral-100 ${
        isLuxury ? "font-serif" : isDarkTech ? "font-mono" : ""
      } ${className}`}
    >
      {/* 1. SELLER MINI PROFILE ROW */}
      <div
        style={topBarStyle}
        className="p-4 sm:px-6 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-xs"
      >
        {/* Left: Avatar, Name, Entity Type, Verified Badge, Public Location */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {resolvedAvatarUrl ? (
              <img
                src={resolvedAvatarUrl}
                alt={resolvedName}
                className="w-10 h-10 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-700 bg-white"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border"
                style={{
                  backgroundColor: isLuxury ? "#1e1e1e" : isDarkTech ? "#051e28" : `${brandColor}15`,
                  borderColor: isLuxury ? "#d97706" : isDarkTech ? "#06b6d4" : `${brandColor}40`,
                  color: isLuxury ? "#f59e0b" : isDarkTech ? "#22d3ee" : brandColor,
                }}
              >
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
              <h3 className="font-bold text-xs sm:text-sm truncate max-w-xs sm:max-w-md">
                {resolvedName}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-[11px] opacity-80 flex-wrap">
              <span className="font-semibold">
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

        {/* Right: CTA View Store (ALWAYS DISPLAYED) */}
        <Link
          href={`/${storeSlug}`}
          className="px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all border shadow-sm self-start sm:self-center cursor-pointer hover:opacity-90 active:scale-95 text-white"
          style={{
            backgroundColor: brandColor,
            borderColor: brandColor,
          }}
        >
          <span>Xem cửa hàng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. OFFER HERO CONTENT */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Category / Type & Expiry Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-xs"
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
          {offer.name}
        </h1>

        {/* Description (If exists) */}
        {(offer.short_description || offer.description) && (
          <p className="text-xs sm:text-sm opacity-85 leading-relaxed max-w-3xl line-clamp-3">
            {offer.short_description || offer.description}
          </p>
        )}

        {/* Metadata Badges Bar */}
        <div
          style={{ borderColor: `${brandColor}20` }}
          className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t"
        >
          {itemCount > 0 && (
            <div className="inline-flex items-center gap-1.5 opacity-85">
              <Package className="w-3.5 h-3.5" style={{ color: brandColor }} />
              <span>{itemCount} sản phẩm/dịch vụ</span>
            </div>
          )}

          {formattedUpdate && (
            <>
              {itemCount > 0 && <span>•</span>}
              <div className="inline-flex items-center gap-1.5 opacity-85">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                <span>Cập nhật {formattedUpdate}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
