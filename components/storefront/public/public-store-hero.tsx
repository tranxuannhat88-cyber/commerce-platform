"use client";

import React from "react";
import { MapPin, ShieldCheck, Phone, Share2, Store as StoreIcon, Building2, User, Camera, Pencil } from "lucide-react";
import { AppUrlService } from "@/lib/services/url";

interface PublicStoreHeroProps {
  storeName: string;
  storeSlug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  actorType: "PERSONAL" | "ORGANIZATION";
  location?: string;
  isVerified?: boolean;
  phone?: string;
  brandColor?: string;
  accentColor?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  isEditable?: boolean;
  onEditLogo?: () => void;
  onEditBanner?: () => void;
  onEditStoreInfo?: () => void;
}

export function PublicStoreHero({
  storeName,
  storeSlug,
  logoUrl,
  coverImageUrl,
  description,
  actorType,
  location,
  isVerified = false,
  phone,
  brandColor = "#00A88F",
  accentColor = "#00D1C2",
  primaryCtaText,
  secondaryCtaText,
  isEditable = false,
  onEditLogo,
  onEditBanner,
  onEditStoreInfo,
}: PublicStoreHeroProps) {
  const [copied, setCopied] = React.useState(false);
  const [logoLoadError, setLogoLoadError] = React.useState(false);

  const handleShare = async () => {
    const storeUrl = AppUrlService.getStoreUrl(storeSlug);
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Ghé thăm cửa hàng trực tuyến của ${storeName} trên nền tảng HINEX`,
          url: storeUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "🏬";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <section className="relative w-full bg-white dark:bg-neutral-900 border-b border-neutral-200/80 dark:border-neutral-800 overflow-hidden">
      {/* 1. COVER PHOTO OR CLEAN NEUTRAL BRANDED BACKGROUND */}
      <div
        className={`relative w-full h-32 sm:h-44 md:h-52 bg-neutral-100 dark:bg-neutral-800 overflow-hidden ${
          isEditable ? "group/banner cursor-pointer select-none" : ""
        }`}
        onClick={isEditable ? onEditBanner : undefined}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={storeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full opacity-90 transition-all flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${brandColor}22 0%, ${accentColor}44 100%)`,
            }}
          >
            {isEditable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBanner?.();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-neutral-900/95 hover:bg-white text-neutral-800 dark:text-neutral-200 text-xs font-bold shadow-md border border-neutral-200/60 dark:border-neutral-700 backdrop-blur-xs transition-all cursor-pointer z-10"
              >
                <Camera className="w-4 h-4 text-[#00B894]" />
                <span>+ Thêm ảnh bìa</span>
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-700/40 opacity-40">
                <StoreIcon className="w-16 h-16 sm:w-24 sm:h-24 stroke-[1]" />
              </div>
            )}
          </div>
        )}

        {/* Hover overlay when banner exists in edit mode */}
        {isEditable && coverImageUrl && (
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 text-xs font-bold shadow-lg border border-neutral-200/50 backdrop-blur-xs">
              <Camera className="w-4 h-4 text-[#00B894]" />
              <span>📷 Thay ảnh bìa</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. STORE IDENTITY DETAILS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-4">
          {/* Avatar / Logo */}
          <div
            className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 p-1.5 shadow-lg border-2 border-white dark:border-neutral-800 shrink-0 overflow-hidden flex items-center justify-center ${
              isEditable ? "group/logo cursor-pointer hover:border-[#00B894] transition-colors select-none" : ""
            }`}
            onClick={isEditable ? onEditLogo : undefined}
          >
            {logoUrl && !logoLoadError ? (
              <img
                src={logoUrl}
                alt={storeName}
                onError={() => setLogoLoadError(true)}
                className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
              />
            ) : (
              <div
                className="w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-inner"
                style={{ backgroundColor: brandColor }}
              >
                {getInitials(storeName)}
              </div>
            )}

            {/* Subtle edit overlay on hover for logo */}
            {isEditable && (
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-xl sm:rounded-2xl pointer-events-none">
                <Pencil className="w-4 h-4 text-[#00B894] mb-0.5" />
                <span className="text-[10px] font-bold tracking-tight">Đổi logo</span>
              </div>
            )}
          </div>

          {/* Quick CTA Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-0">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{primaryCtaText || "Liên hệ"}</span>
              </a>
            ) : (
              <a
                href="#contact"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <span>{primaryCtaText || "Thông tin liên hệ"}</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer relative"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{secondaryCtaText || "Chia sẻ"}</span>
              {copied && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md whitespace-nowrap animate-in fade-in shadow-md">
                  Đã copy link!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Title, Badges & Real Description */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 group/name">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {storeName}
            </h1>
            {isEditable && (
              <button
                type="button"
                onClick={onEditStoreInfo}
                title="Chỉnh sửa tên và thông tin cửa hàng tại Thiết lập"
                className="opacity-50 hover:opacity-100 text-neutral-400 hover:text-[#00B894] p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Đã xác minh</span>
              </span>
            )}
          </div>

          {/* Actor Type & Public Location Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold">
              {actorType === "ORGANIZATION" ? (
                <>
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span>Doanh nghiệp / Tổ chức</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Cá nhân kinh doanh</span>
                </>
              )}
            </span>

            {location && (
              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="truncate max-w-xs">{location}</span>
              </span>
            )}
          </div>

          {/* Real Store Description */}
          {description && (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
