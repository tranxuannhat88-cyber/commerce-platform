"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, ShoppingBag, PhoneCall, Star } from "lucide-react";
import { Store, StoreTemplate, StoreCustomizationSettings } from "@/types";

interface TemplateHeroProps {
  store: Store;
  template: StoreTemplate;
  customization?: StoreCustomizationSettings;
  offerCount?: number;
  productCount?: number;
}

export function TemplateHero({ store, template, customization, offerCount = 0, productCount = 0 }: TemplateHeroProps) {
  const heroTitle = customization?.hero_title || store.store_name || "Gian Hàng Trực Tuyến";
  const heroSubtitle =
    customization?.hero_subtitle ||
    store.description ||
    "Khám phá các sản phẩm chính hãng, dịch vụ chất lượng cao với thanh toán VietQR Napas247 bảo mật.";

  const layout = template.design_tokens.hero_layout;
  const brandColor = customization?.brand_color || template.design_tokens.color_palette_default.primary;
  const accentColor = customization?.accent_color || template.design_tokens.color_palette_default.accent;

  // 1. STORYTELLING HERO (Signature & Studio Pro)
  if (layout === "storytelling") {
    return (
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>{template.name} Collection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
            {heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a
              href="#products"
              className="px-8 py-3.5 text-xs sm:text-sm font-bold text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
              style={{ backgroundColor: brandColor }}
            >
              <span>Xem Bộ Sưu Tập</span>
            </a>
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="px-6 py-3.5 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-50 rounded-full border border-neutral-300 dark:border-neutral-700 transition-all flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Liên Hệ Trực Tiếp</span>
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 2. SPLIT HERO (Business, Service, Corporate Pro, Professional)
  if (layout === "split") {
    return (
      <section className="py-12 sm:py-16 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Đơn Vị Xác Thực Doanh Nghiệp</span>
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
                  className="px-6 py-3 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: brandColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Danh Mục Sản Phẩm</span>
                </a>
                <a
                  href="#contact"
                  className="px-5 py-3 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                >
                  <span>Hồ Sơ Năng Lực & Liên Hệ</span>
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

  // 3. BANNER HERO (Modern, Market, Prime, Commerce Pro, Showcase)
  if (layout === "banner") {
    return (
      <section className="relative overflow-hidden py-12 sm:py-20 bg-linear-to-b from-neutral-50 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 sm:p-14 lg:p-16 shadow-2xl">
            {/* Background Cover Overlay */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
              <img
                src={
                  customization?.hero_banner_url ||
                  store.cover_image_url ||
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80"
                }
                alt="Store Banner"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-900/80 to-transparent" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Cửa Hàng Trực Tuyến Chính Thức</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                {heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed line-clamp-3">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="#products"
                  className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Mua Sắm Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                {offerCount > 0 && (
                  <a
                    href="#offers"
                    className="px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/20"
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

  // 4. MINIMAL / CENTERED HERO (Minimal, Compact, Local)
  return (
    <section className="py-8 sm:py-12 border-b border-neutral-100 dark:border-neutral-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {heroTitle}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto line-clamp-2">
          {heroSubtitle}
        </p>
      </div>
    </section>
  );
}
