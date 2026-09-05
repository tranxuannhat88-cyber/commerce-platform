"use client";

import React from "react";
import Link from "next/link";
import { Package, ShoppingCart, Check, Plus, Tag } from "lucide-react";
import { Product, Offer } from "@/types";
import { formatVND } from "@/lib/utils";

interface PublicStoreProductGridProps {
  products: Product[];
  offers: Offer[];
  storeSlug: string;
  brandColor?: string;
  onAddToCart?: (product: Product) => void;
}

export function PublicStoreProductGrid({
  products,
  offers,
  storeSlug,
  brandColor = "#00A88F",
  onAddToCart,
}: PublicStoreProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
          <Package className="w-6 h-6 opacity-60" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Cửa hàng chưa đăng sản phẩm công khai
          </p>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Vui lòng liên hệ trực tiếp với người bán hoặc quay lại sau để cập nhật danh mục mới nhất.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section id="products" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" style={{ color: brandColor }} />
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Sản Phẩm & Dịch Vụ
          </h2>
          <span className="text-xs font-semibold text-neutral-400">({products.length})</span>
        </div>
      </div>

      {/* Responsive Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.map((product) => {
          const displayImage =
            product.image_url ||
            (product.gallery && product.gallery.length > 0 ? product.gallery[0] : null);

          // Find if this product is part of any active offer
          const matchingOffer = offers.find((o) =>
            o.items?.some((it) => it.name.trim().toLowerCase() === product.name.trim().toLowerCase() || it.id === product.id)
          );

          const isOutOfStock = product.availability_status === "OUT_OF_STOCK" || product.is_available === false;
          const isLowStock = product.availability_status === "LOW_STOCK";

          const productPriceText =
            product.price > 0
              ? formatVND(product.price)
              : "Liên hệ báo giá";

          return (
            <div
              key={product.id}
              className="group bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200/90 dark:border-neutral-800 hover:border-[#00A88F]/40 dark:hover:border-[#00A88F]/40 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/80">
                      <Package className="w-8 h-8 mb-1 opacity-30" />
                      <span className="text-[9px] font-medium opacity-50">Chưa có ảnh</span>
                    </div>
                  )}

                  {/* Badges */}
                  {matchingOffer && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#00A88F] text-white shadow-xs">
                        Có Offer
                      </span>
                    </div>
                  )}

                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-md">
                        Tạm hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-3 sm:p-4 space-y-1.5">
                  <h3
                    className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug group-hover:text-[#007C73] dark:group-hover:text-[#00D1C2] transition-colors"
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                    <span
                      className="text-xs sm:text-base font-black tracking-tight"
                      style={{ color: product.price > 0 ? brandColor : undefined }}
                    >
                      {productPriceText}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                        {formatVND(product.compare_at_price)}
                      </span>
                    )}
                    {product.unit && product.price > 0 && (
                      <span className="text-[10px] text-neutral-400">/{product.unit}</span>
                    )}
                  </div>

                  {/* Availability note on desktop */}
                  <div className="hidden sm:block pt-0.5">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-semibold text-rose-500">● Hết hàng</span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-semibold text-amber-500">● Sắp hết</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-600">● Sẵn hàng</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-3 sm:p-4 pt-0">
                {matchingOffer ? (
                  <Link
                    href={`/${storeSlug}/o/${matchingOffer.slug}`}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-[#E6F7F4] dark:bg-neutral-800 dark:hover:bg-teal-950/40 text-neutral-800 dark:text-neutral-200 hover:text-[#007C73] dark:hover:text-[#00D1C2] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <span>Xem trong Offer</span>
                  </Link>
                ) : onAddToCart && !isOutOfStock && product.price > 0 ? (
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-full py-2 px-3 rounded-xl bg-[#00A88F] hover:bg-[#007C73] active:scale-95 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Đặt mua</span>
                  </button>
                ) : (
                  <a
                    href="#contact"
                    className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-[11px] sm:text-xs flex items-center justify-center transition-all text-center"
                  >
                    <span>Liên hệ</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
