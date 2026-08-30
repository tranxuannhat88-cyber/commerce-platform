"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Star, ArrowRight, Store as StoreIcon, Building2, User } from "lucide-react";
import { SellerMiniCardDTO } from "@/lib/storefront/types";

interface SellerMiniCardProps {
  seller: SellerMiniCardDTO;
  className?: string;
}

export function SellerMiniCard({ seller, className = "" }: SellerMiniCardProps) {
  const destinationHref = seller.has_store && seller.store_slug
    ? `/${seller.store_slug}`
    : `/seller/${seller.seller_slug}`;

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs flex items-center justify-between gap-3 ${className}`}
    >
      {/* Left: Avatar & Identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          {seller.logo_url ? (
            <img
              src={seller.logo_url}
              alt={seller.seller_display_name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
              {seller.actor_type === "ORGANIZATION" ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
          )}

          {seller.is_verified && (
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
              title={seller.badge_text}
            >
              <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {seller.seller_display_name}
            </h4>
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              ✓ {seller.badge_text}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-0.5 font-bold text-amber-500 dark:text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {seller.rating_average.toFixed(1)}
            </span>
            <span>•</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {seller.transaction_count} giao dịch
            </span>
            <span>•</span>
            <span className="truncate">{seller.location_summary}</span>
          </div>
        </div>
      </div>

      {/* Right: View Store / Profile Button */}
      <Link
        href={destinationHref}
        className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
      >
        <span>{seller.has_store ? "Xem Cửa Hàng" : "Xem Hồ Sơ"}</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
