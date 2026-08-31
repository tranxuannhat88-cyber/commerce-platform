"use client";

import React, { useState } from "react";
import { Store, StoreTemplate, Product, Offer, Category, Organization, StoreCustomizationSettings } from "@/types";
import { TemplateNavbar } from "./shared/template-navbar";
import { TemplateHero } from "./shared/template-hero";
import { TemplateCategories } from "./shared/template-categories";
import { TemplateProductGrid } from "./shared/template-product-grid";
import { TemplateOffers } from "./shared/template-offers";
import { TemplateTrust } from "./shared/template-trust";
import { TemplateAboutContact } from "./shared/template-about-contact";

export interface TemplateEngineProps {
  template: StoreTemplate;
  store: Store;
  organization?: Organization;
  products: Product[];
  offers: Offer[];
  categories: Category[];
  customization?: StoreCustomizationSettings;
  storeSlug: string;
  onAddToCart?: (product: Product) => void;
  isDemoPreview?: boolean;
}

export function TemplateEngine({
  template,
  store,
  organization,
  products,
  offers,
  categories,
  customization,
  storeSlug,
  onAddToCart,
  isDemoPreview = false,
}: TemplateEngineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const brandColor = customization?.brand_color || template.design_tokens.color_palette_default.primary;
  const accentColor = customization?.accent_color || template.design_tokens.color_palette_default.accent;
  const visibleSections = customization?.visible_sections || {};

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const containerWidthClass =
    template.design_tokens.container_width === "compact"
      ? "max-w-4xl"
      : template.design_tokens.container_width === "fluid"
      ? "max-w-(--breakpoint-2xl)"
      : "max-w-7xl";

  const isDarkTech = template.code === "PREMIUM_DARK_TECH";
  const isLuxury = template.code === "PREMIUM_FLAGSHIP_LUXURY";

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkTech
          ? "bg-black text-cyan-50 font-mono"
          : isLuxury
          ? "bg-neutral-950 text-amber-50 font-serif"
          : "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans"
      }`}
    >
      {/* 0. INTEGRATED SLEEK STOREFRONT NAVBAR */}
      <TemplateNavbar
        store={store}
        organization={organization}
        template={template}
        customization={customization}
        storeSlug={storeSlug}
      />

      {/* 1. HERO SECTION */}
      {visibleSections.hero !== false && (
        <TemplateHero
          store={store}
          template={template}
          customization={customization}
          offerCount={offers.length}
          productCount={products.length}
        />
      )}

      <div className={`${containerWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12`}>
        {/* 2. TRUST BAR (Top placement for Professional, Modern, Corporate Pro, Dark Tech) */}
        {(template.code === "FREE_PROFESSIONAL" ||
          template.code === "PREMIUM_CORPORATE_PRO" ||
          template.code === "PREMIUM_DARK_TECH" ||
          template.code === "FREE_MODERN") &&
          visibleSections.trust_bar !== false && (
            <TemplateTrust template={template} brandColor={brandColor} accentColor={accentColor} />
          )}

        {/* 3. FEATURED OFFERS SECTION */}
        {visibleSections.featured_offers !== false && offers.length > 0 && (
          <TemplateOffers
            offers={offers}
            template={template}
            storeSlug={storeSlug}
            brandColor={brandColor}
            accentColor={accentColor}
          />
        )}

        {/* 4. CATEGORIES FILTER & PRODUCT GRID */}
        {visibleSections.products !== false && (
          <section id="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {template.code === "FREE_SERVICE"
                    ? "Dịch Vụ Cung Cấp"
                    : template.code === "PREMIUM_FLAGSHIP_LUXURY"
                    ? "Bộ Sưu Tập Tuyển Chọn"
                    : "Sản Phẩm Cửa Hàng"}
                </h2>
                <p className="text-xs text-neutral-400">
                  Hiển thị {filteredProducts.length} mặt hàng có sẵn giao ngay
                </p>
              </div>

              {visibleSections.categories !== false && categories.length > 0 && (
                <TemplateCategories
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  brandColor={brandColor}
                />
              )}
            </div>

            <TemplateProductGrid
              products={filteredProducts}
              template={template}
              storeSlug={storeSlug}
              onAddToCart={onAddToCart}
              brandColor={brandColor}
              accentColor={accentColor}
            />
          </section>
        )}

        {/* 5. TRUST BAR (Bottom placement for remaining templates) */}
        {!(template.code === "FREE_PROFESSIONAL" ||
          template.code === "PREMIUM_CORPORATE_PRO" ||
          template.code === "PREMIUM_DARK_TECH" ||
          template.code === "FREE_MODERN") &&
          visibleSections.trust_bar !== false && (
            <TemplateTrust template={template} brandColor={brandColor} accentColor={accentColor} />
          )}

        {/* 6. ABOUT & CONTACT */}
        {visibleSections.about !== false && (
          <TemplateAboutContact store={store} organization={organization} brandColor={brandColor} />
        )}
      </div>
    </div>
  );
}
