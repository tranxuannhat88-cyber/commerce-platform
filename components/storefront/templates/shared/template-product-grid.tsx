"use client";

import React from "react";
import Link from "next/link";
import { Plus, Check, Eye, Package, ShoppingCart } from "lucide-react";
import { Product, StoreTemplate } from "@/types";
import { formatVND } from "@/lib/utils";

interface TemplateProductGridProps {
  products: Product[];
  template: StoreTemplate;
  storeSlug: string;
  onAddToCart?: (product: Product) => void;
  brandColor?: string;
  accentColor?: string;
}

export function TemplateProductGrid({
  products,
  template,
  storeSlug,
  onAddToCart,
  brandColor = "#2563eb",
  accentColor = "#3b82f6",
}: TemplateProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-400">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-xs font-semibold">Cửa hàng hiện chưa có sản phẩm nào được hiển thị.</p>
      </div>
    );
  }

  const cardStyle = template.design_tokens.product_card_style;

  // 1. COMPACT LIST VIEW (Compact Template)
  if (cardStyle === "compact") {
    return (
      <div className="space-y-2.5">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 transition-all gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Package className="w-6 h-6 opacity-40" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{product.name}</h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">{formatVND(product.price)}</span>
                  {product.compare_at_price && (
                    <span className="text-[10px] text-neutral-400 line-through">
                      {formatVND(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mua</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // 2. EDITORIAL / LOOKBOOK STYLE (Showcase, Signature, Studio Pro)
  if (cardStyle === "editorial") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300"
          >
            <div className="relative aspect-4/5 bg-neutral-100 dark:bg-neutral-900 overflow-hidden rounded-2xl">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <Package className="w-12 h-12 opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <button
                  onClick={() => onAddToCart && onAddToCart(product)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl transition-transform transform translate-y-2 group-hover:translate-y-0 cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Thêm Vào Giỏ</span>
                </button>
              </div>
            </div>

            <div className="pt-3.5 space-y-1 text-center">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {formatVND(product.price)}
                </span>
                {product.compare_at_price && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatVND(product.compare_at_price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. STANDARD ELEVATED / BORDERED / MINIMAL GRID (Modern, Prime, Market, Catalog, Minimal...)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className={`group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
            cardStyle === "elevated"
              ? "shadow-sm hover:shadow-xl border border-neutral-100 dark:border-neutral-800"
              : cardStyle === "bordered"
              ? "border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500"
              : "border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400"
          }`}
        >
          <div>
            <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <Package className="w-10 h-10 opacity-30" />
                </div>
              )}
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-xs">
                  -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                </span>
              )}
            </div>

            <div className="p-3.5 space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {formatVND(product.price)}
                </span>
                {product.compare_at_price && (
                  <span className="text-[11px] text-neutral-400 line-through">
                    {formatVND(product.compare_at_price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 pt-0">
            <button
              onClick={() => onAddToCart && onAddToCart(product)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Thêm Giỏ Hàng</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
