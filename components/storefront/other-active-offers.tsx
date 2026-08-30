"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface OtherOfferItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  image_url?: string;
  store_slug: string;
}

interface OtherActiveOffersProps {
  offers: OtherOfferItem[];
  storeName: string;
}

export function OtherActiveOffers({ offers, storeName }: OtherActiveOffersProps) {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ưu Đãi Khác Từ Cửa Hàng</span>
          </h3>
          <p className="text-xs text-neutral-500">Các gói ưu đãi đang phát hành từ {storeName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/${offer.store_slug}/o/${offer.slug}`}
            className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 shadow-2xs hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
              {offer.image_url ? (
                <img
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <Tag className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors">
                {offer.name}
              </h4>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-xs text-blue-600 dark:text-blue-400">
                  {formatVND(offer.price)}
                </span>
                {offer.compare_at_price && offer.compare_at_price > offer.price && (
                  <span className="text-[10px] text-neutral-400 line-through">
                    {formatVND(offer.compare_at_price)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
