"use client";

import React from "react";
import Link from "next/link";
import { Tag, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { Offer, StoreTemplate } from "@/types";
import { formatVND } from "@/lib/utils";

interface TemplateOffersProps {
  offers: Offer[];
  template: StoreTemplate;
  storeSlug: string;
  brandColor?: string;
  accentColor?: string;
}

export function TemplateOffers({
  offers,
  template,
  storeSlug,
  brandColor = "#2563eb",
  accentColor = "#3b82f6",
}: TemplateOffersProps) {
  if (offers.length === 0) return null;

  return (
    <section id="offers" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
          >
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100">
              Ưu Đãi & Bảng Giá Nổi Bật
            </h2>
            <p className="text-xs text-neutral-400">Combo khuyến mãi và bảng giá phát hành trực tiếp</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {offers.map((offer) => {
          const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 1);
          const targetUrl = `/${storeSlug}/o/${offer.slug}`;
          const displayImage = (offer.items && offer.items.length > 0 && offer.items[0].image_url) || offer.image_url;

          return (
            <Link
              key={offer.id}
              href={targetUrl}
              className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              style={{
                borderColor: undefined,
              }}
            >
              <div>
                <div className="relative aspect-16/9 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={offer.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Tag className="w-8 h-8 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1 shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{isCatalog ? "BẢNG GIÁ" : "ƯU ĐÃI ĐẶC BIỆT"}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 transition-colors">
                    {offer.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-base font-black"
                      style={{ color: brandColor }}
                    >
                      {isCatalog ? `Từ ${formatVND(offer.price)}` : formatVND(offer.price)}
                    </span>
                    {offer.compare_at_price && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatVND(offer.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {offer.short_description || offer.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div
                  className="flex items-center justify-between text-xs font-bold group-hover:translate-x-1 transition-transform"
                  style={{ color: brandColor }}
                >
                  <span>Xem chi tiết & Đặt mua</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
