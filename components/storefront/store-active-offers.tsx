"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Tag, Flame } from "lucide-react";
import { formatVND } from "@/lib/utils";

interface ActiveOfferItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  image_url?: string;
  store_slug: string;
}

interface StoreActiveOffersProps {
  offers: ActiveOfferItem[];
}

export function StoreActiveOffers({ offers }: StoreActiveOffersProps) {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-white" />
          </div>
          <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
            Ưu Đãi Đang Diễn Ra (Active Offers)
          </h3>
        </div>
        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
          {offers.length} Ưu đãi
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/${offer.store_slug}/o/${offer.slug}`}
            className="p-3.5 rounded-3xl bg-linear-to-br from-white to-rose-50/30 dark:from-neutral-900 dark:to-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs hover:shadow-lg transition-all flex items-center gap-3.5 group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 relative">
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
              <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[9px] uppercase shadow-2xs">
                Ưu đãi
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                {offer.name}
              </h4>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  {formatVND(offer.price)}
                </span>
                {offer.compare_at_price && offer.compare_at_price > offer.price && (
                  <span className="text-[10px] text-neutral-400 line-through">
                    {formatVND(offer.compare_at_price)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
