"use client";

import React from "react";
import Link from "next/link";
import { Plus, Check, Eye, Package, ShoppingCart, Sparkles, Crown, Zap, PhoneCall } from "lucide-react";
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

  // 1. PREMIUM FLAGSHIP LUXURY PRODUCT CARDS (Gold & Obsidian)
  if (template.code === "PREMIUM_FLAGSHIP_LUXURY") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative bg-neutral-950 border border-amber-500/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-500 hover:border-amber-400/70 hover:shadow-amber-500/10"
          >
            <div>
              <div className="relative aspect-4/5 bg-neutral-900 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-500/30">
                    <Crown className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-black/80 text-amber-300 border border-amber-500/40 uppercase backdrop-blur-md flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span>Luxury Edition</span>
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2 text-center">
                <h4 className="text-sm sm:text-base font-serif font-bold text-amber-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base font-serif font-black text-amber-400">
                    {formatVND(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-xs text-neutral-500 line-through">
                      {formatVND(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                type="button"
                onClick={() => onAddToCart && onAddToCart(product)}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-neutral-950 bg-linear-to-r from-amber-400 to-amber-200 hover:from-amber-300 hover:to-amber-100 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-neutral-950" />
                <span>Thêm Vào Giỏ Hàng</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. PREMIUM DARK TECH / CYBERPUNK PRODUCT CARDS (Neon Cyan & Purple)
  if (template.code === "PREMIUM_DARK_TECH") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative bg-black border border-cyan-500/30 hover:border-cyan-400 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.08)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] font-mono"
          >
            <div>
              <div className="relative aspect-16/10 bg-neutral-950 overflow-hidden border-b border-cyan-900/40">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-500/20">
                    <Zap className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  ID: #{product.id.slice(-4).toUpperCase()}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-black text-cyan-400">
                    {formatVND(product.price)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">● IN STOCK</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={() => onAddToCart && onAddToCart(product)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>CHỌN MẶT HÀNG</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. FREE SERVICE PRODUCT CARDS (Service Packages & Quotes)
  if (template.code === "FREE_SERVICE") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 transition-all space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0 font-bold text-lg">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Package className="w-6 h-6" />
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Gói Dịch Vụ
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {formatVND(product.price)}
                  </span>
                  <span className="text-xs text-neutral-400">/ Trọn gói</span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                {product.description || "Cam kết bàn giao đúng tiến độ, hỗ trợ bảo hành và bảo trì trọn gói theo hợp đồng."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(product)}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Đặt Dịch Vụ Này</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // 4. FREE CATALOG / HIGH DENSITY 4-COLUMN GRID
  if (template.code === "FREE_CATALOG") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between hover:border-blue-500 hover:shadow-lg transition-all"
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
                    <Package className="w-8 h-8 opacity-30" />
                  </div>
                )}
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                    -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
              </div>

              <div className="p-3 space-y-1">
                <span className="text-[10px] text-neutral-400 block truncate uppercase font-semibold">
                  {product.category || "Sản Phẩm"}
                </span>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {formatVND(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-[10px] text-neutral-400 line-through">
                      {formatVND(product.compare_at_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 pt-0">
              <button
                type="button"
                onClick={() => onAddToCart && onAddToCart(product)}
                className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                style={{ backgroundColor: brandColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mua Nhanh</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 5. STANDARD ELEVATED GRID (Modern, Minimal, Local, Showcase, etc.)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
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
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                  -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                </span>
              )}
            </div>

            <div className="p-4 space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
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

          <div className="p-4 pt-0">
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(product)}
              className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
