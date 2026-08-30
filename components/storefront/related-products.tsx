"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Plus, ArrowRight, Package } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useCart } from "./cart-drawer";

interface RelatedProductItem {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  image_url?: string;
  unit?: string;
  is_available: boolean;
  availability_status?: import("@/types").AvailabilityStatus;
}

interface RelatedProductsProps {
  products: RelatedProductItem[];
  storeSlug: string;
  storeName: string;
}

export function RelatedProducts({
  products,
  storeSlug,
  storeName,
}: RelatedProductsProps) {
  const { addToCart, setIsCartOpen } = useCart();

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Có Thể Bạn Quan Tâm</span>
          </h3>
          <p className="text-xs text-neutral-500">Sản phẩm cùng danh mục từ {storeName}</p>
        </div>

        <Link
          href={`/${storeSlug}`}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Xem Tất Cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => {
          const isOutOfStock = !p.is_available || p.availability_status === "OUT_OF_STOCK";

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between p-3 shadow-2xs hover:shadow-md transition-shadow group"
            >
              <div className="space-y-2">
                <div className="relative w-full aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                      <span className="px-2 py-1 rounded-lg bg-neutral-900 text-white font-bold text-[10px]">
                        TẠM HẾT HÀNG
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="font-black text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                      {formatVND(p.price)}
                    </span>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="text-[10px] text-neutral-400 line-through">
                        {formatVND(p.compare_at_price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => {
                    const productOffer: import("@/types").Offer = {
                      id: p.id,
                      organization_id: "org-2k-tech",
                      store_id: "store-2k-official",
                      offer_type: "PRODUCT",
                      name: p.name,
                      slug: p.id,
                      price: p.price,
                      compare_at_price: p.compare_at_price,
                      image_url: p.image_url,
                      status: "ACTIVE",
                      inventory_tracking: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    addToCart(productOffer, undefined, 1);
                    setIsCartOpen(true);
                  }}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isOutOfStock
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-100 hover:bg-blue-600 text-neutral-800 hover:text-white dark:bg-neutral-800 dark:hover:bg-blue-600 dark:text-neutral-200 active:scale-95"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Vào Giỏ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
