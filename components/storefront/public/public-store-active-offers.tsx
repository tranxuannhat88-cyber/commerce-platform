"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Package, ListOrdered, Tag } from "lucide-react";
import { Offer } from "@/types";
import { formatVND } from "@/lib/utils";
import { AppUrlService } from "@/lib/services/url";

interface PublicStoreActiveOffersProps {
  offers: Offer[];
  storeSlug: string;
  brandColor?: string;
  accentColor?: string;
}

export function PublicStoreActiveOffers({
  offers,
  storeSlug,
  brandColor = "#2563eb",
  accentColor = "#3b82f6",
}: PublicStoreActiveOffersProps) {
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: brandColor }} />
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Ưu Đãi & Offer Đang Mở
          </h2>
          <span className="text-xs font-semibold text-neutral-400">({offers.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {offers.map((offer) => {
          const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 1);
          const displayImage = offer.image_url || (offer.items && offer.items.length > 0 && offer.items[0].image_url);
          const offerHref = `/${storeSlug}/o/${offer.slug}`;
          const itemCount = offer.items?.length || 1;

          return (
            <Link
              key={offer.id}
              href={offerHref}
              className="group bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200/90 dark:border-neutral-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div>
                {/* Offer Image */}
                <div className="relative aspect-16/10 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={offer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/80">
                      <Package className="w-8 h-8 mb-1 opacity-40" />
                      <span className="text-[10px] font-medium opacity-60">Chưa có hình ảnh</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    {isCatalog ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                        <ListOrdered className="w-3 h-3" />
                        <span>OFFER ({itemCount} MỤC)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-900/85 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                        <span>{offer.offer_type === "PRODUCT" ? "📦 SẢN PHẨM" : "🛠️ DỊCH VỤ"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {offer.name}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base sm:text-lg font-black" style={{ color: brandColor }}>
                      {isCatalog ? `Từ ${formatVND(offer.price)}` : formatVND(offer.price)}
                    </span>
                    {offer.compare_at_price && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatVND(offer.compare_at_price)}
                      </span>
                    )}
                    {offer.service_unit && (
                      <span className="text-xs text-neutral-400">/{offer.service_unit}</span>
                    )}
                  </div>

                  {offer.short_description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {offer.short_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-bold" style={{ color: brandColor }}>
                  <span>Xem chi tiết & Đặt mua</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
