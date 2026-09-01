"use client";

import React from "react";
import { MapPin, ShieldCheck, Phone, Share2, Store as StoreIcon, Building2, User } from "lucide-react";
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
  brandColor = "#2563eb",
  accentColor = "#3b82f6",
}: PublicStoreHeroProps) {
  const [copied, setCopied] = React.useState(false);
  const [logoLoadError, setLogoLoadError] = React.useState(false);

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
      <div className="relative w-full h-32 sm:h-44 md:h-52 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={storeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full opacity-90 transition-all"
            style={{
              background: `linear-gradient(135deg, ${brandColor}22 0%, ${accentColor}44 100%)`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-neutral-300 dark:text-neutral-700/40 opacity-40">
              <StoreIcon className="w-16 h-16 sm:w-24 sm:h-24 stroke-[1]" />
            </div>
          </div>
        )}
      </div>

      {/* 2. STORE IDENTITY DETAILS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-4">
          {/* Avatar / Logo */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 p-1.5 shadow-lg border-2 border-white dark:border-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
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
                <span>Liên hệ</span>
              </a>
            ) : (
              <a
                href="#contact"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <span>Thông tin liên hệ</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-all cursor-pointer relative"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ</span>
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {storeName}
            </h1>

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
