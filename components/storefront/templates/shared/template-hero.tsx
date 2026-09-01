"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  PhoneCall,
  Star,
  Zap,
  MapPin,
  Clock,
  CheckCircle,
  Crown,
  Search,
} from "lucide-react";
import { Store, StoreTemplate, StoreCustomizationSettings } from "@/types";

interface TemplateHeroProps {
  store: Store;
  template: StoreTemplate;
  customization?: StoreCustomizationSettings;
  offerCount?: number;
  productCount?: number;
}

export function TemplateHero({
  store,
  template,
  customization,
  offerCount = 0,
  productCount = 0,
}: TemplateHeroProps) {
  const heroTitle = customization?.hero_title || store.store_name || "Gian Hàng Trực Tuyến";
  const heroSubtitle =
    customization?.hero_subtitle ||
    store.description ||
    "Khám phá các sản phẩm chính hãng, dịch vụ chất lượng cao với thanh toán VietQR Napas247 bảo mật.";

  const brandColor = customization?.brand_color || template.design_tokens.color_palette_default.primary;
  const accentColor = customization?.accent_color || template.design_tokens.color_palette_default.accent;

  // 1. PREMIUM FLAGSHIP LUXURY HERO
  if (template.code === "PREMIUM_FLAGSHIP_LUXURY") {
    return (
      <section className="relative overflow-hidden py-16 sm:py-24 bg-neutral-950 text-amber-100 border-b border-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-neutral-950 to-neutral-950" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            <span>Bộ Sưu Tập Cao Cấp • Flagship Edition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black text-amber-50 tracking-tight leading-tight">
            {heroTitle}
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#products"
              className="px-8 py-3.5 text-xs sm:text-sm font-bold text-neutral-950 rounded-full transition-all shadow-xl hover:shadow-amber-500/20 bg-linear-to-r from-amber-400 to-amber-200 hover:from-amber-300 hover:to-amber-100 transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-neutral-950" />
              <span>Khám Phá Bộ Sưu Tập</span>
            </a>
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="px-6 py-3.5 text-xs sm:text-sm font-bold text-amber-200 bg-neutral-900/80 hover:bg-neutral-800 rounded-full border border-amber-500/30 transition-all flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Tư Vấn VIP</span>
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 2. PREMIUM DARK TECH / CYBERPUNK HERO
  if (template.code === "PREMIUM_DARK_TECH") {
    return (
      <section className="relative overflow-hidden py-14 sm:py-20 bg-black text-white border-b border-cyan-500/30 shadow-[inset_0_1px_30px_rgba(6,182,212,0.1)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <Zap className="w-3.5 h-3.5" />
                <span>SYSTEM_ONLINE // {template.name.toUpperCase()}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {heroTitle}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 font-mono leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#products"
                  className="px-6 py-3 rounded-xl text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>TRUY CẬP CATALOG ({productCount})</span>
                </a>
                {offerCount > 0 && (
                  <a
                    href="#offers"
                    className="px-5 py-3 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-neutral-900 border border-cyan-500/30 hover:border-cyan-400 transition-colors"
                  >
                    <span>KHUYẾN MÃI [{offerCount}]</span>
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 p-5 rounded-2xl bg-neutral-950/90 border border-cyan-500/30 font-mono text-xs space-y-3 shadow-xl">
              <div className="text-cyan-400 font-bold border-b border-cyan-900/60 pb-2 flex items-center justify-between">
                <span>THÔNG SỐ CỬA HÀNG</span>
                <span className="text-emerald-400">● LIVE</span>
              </div>
              <div className="space-y-1.5 text-neutral-400">
                <div className="flex justify-between"><span>Sản phẩm:</span> <strong className="text-white">{productCount} SKU</strong></div>
                <div className="flex justify-between"><span>Ưu đãi HOT:</span> <strong className="text-cyan-300">{offerCount} Bảng giá</strong></div>
                <div className="flex justify-between"><span>Bảo mật:</span> <strong className="text-emerald-400">VietQR Napas247</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 3. FREE CATALOG / HIGH DENSITY HERO
  if (template.code === "FREE_CATALOG") {
    return (
      <section className="py-8 bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-neutral-800/90 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <ShoppingBag className="w-4 h-4" />
                <span>Danh Mục Bán Sỉ & Lẻ Toàn Diện</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100">
                {heroTitle}
              </h1>
              <p className="text-xs text-neutral-500 max-w-xl">{heroSubtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#products"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                <span>Xem Tất Cả {productCount} Sản Phẩm</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 4. FREE LOCAL STORE HERO (Quán / Shop / Dịch vụ địa phương)
  if (template.code === "FREE_LOCAL") {
    return (
      <section className="py-10 bg-amber-50/50 dark:bg-neutral-900 border-b border-amber-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                📍 Điểm Bán & Dịch Vụ Địa Phương
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{heroSubtitle}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
                {store.address && (
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{store.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Mở cửa: 08:00 – 21:30</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col sm:flex-row gap-3 md:justify-end">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="px-5 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Gọi Hotline Đặt Ngay</span>
                </a>
              )}
              <a
                href="#products"
                className="px-5 py-3 rounded-2xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Xem Menu / Món</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 5. SPLIT HERO (FREE_SERVICE, FREE_PROFESSIONAL, PREMIUM_CORPORATE_PRO)
  if (template.design_tokens.hero_layout === "split" || template.code === "FREE_SERVICE") {
    return (
      <section className="py-12 sm:py-16 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Đơn Vị Xác Thực Năng Lực & Dịch Vụ</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
                {heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#products"
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-white rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{template.code === "FREE_SERVICE" ? "Bảng Giá Dịch Vụ" : "Danh Mục Sản Phẩm"}</span>
                </a>
                <a
                  href="#contact"
                  className="px-5 py-3 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl transition-colors"
                >
                  <span>Hồ Sơ & Liên Hệ</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={
                    customization?.hero_banner_url ||
                    store.cover_image_url ||
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80"
                  }
                  alt={store.store_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-300">{store.store_name}</p>
                    <p className="text-sm font-semibold opacity-90">{productCount} Sản phẩm • {offerCount} Ưu đãi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 6. BANNER HERO (FREE_MODERN, FREE_MARKET, FREE_PRIME, FREE_COMMERCE_PRO, FREE_SHOWCASE)
  if (template.design_tokens.hero_layout === "banner" || template.code === "FREE_MODERN") {
    return (
      <section className="relative overflow-hidden py-8 sm:py-14 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative rounded-3xl overflow-hidden text-white p-8 sm:p-14 lg:p-16 shadow-2xl transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${brandColor}, ${accentColor || brandColor}ee, #0f172a)`,
            }}
          >
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{template.name} Edition • Gian Hàng Chính Thức</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                {heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed line-clamp-3">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="#products"
                  className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" style={{ color: brandColor }} />
                  <span>Mua Sắm Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                {offerCount > 0 && (
                  <a
                    href="#offers"
                    className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all border border-white/20"
                  >
                    <span>Xem {offerCount} Ưu Đãi HOT</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 7. MINIMAL HERO (FREE_MINIMAL, FREE_COMPACT)
  return (
    <section className="py-10 sm:py-14 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl space-y-4 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${brandColor}, ${accentColor || brandColor}ee, #1e1b4b)`,
          }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{template.name} • {template.category}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {heroTitle}
          </h1>

          <p className="text-xs sm:text-sm text-white/90 max-w-xl mx-auto leading-relaxed line-clamp-3">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#products"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-neutral-900 shadow-md hover:bg-neutral-100 transition-all flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" style={{ color: brandColor }} />
              <span>Xem Sản Phẩm</span>
            </a>
            {offerCount > 0 && (
              <a
                href="#offers"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 transition-all"
              >
                <span>Ưu Đãi ({offerCount})</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
