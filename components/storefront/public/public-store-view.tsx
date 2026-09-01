"use client";

import React, { useState, useRef } from "react";
import { ResolvedPublicStoreData } from "@/lib/server/storefront-data-resolver";
import { PublicStoreHeader } from "./public-store-header";
import { PublicStoreHero } from "./public-store-hero";
import { PublicStoreSearch } from "./public-store-search";
import { PublicStoreCategories } from "./public-store-categories";
import { PublicStoreActiveOffers } from "./public-store-active-offers";
import { PublicStoreProductGrid } from "./public-store-product-grid";
import { PublicStoreTrust } from "./public-store-trust";
import { PublicStoreAbout } from "./public-store-about";
import { PublicStoreContactPolicies } from "./public-store-contact-policies";
import { PublicStoreFooter } from "./public-store-footer";
import { CartProvider, CartDrawer, useCart } from "@/components/storefront/cart-drawer";
import { Product, Offer } from "@/types";
import { formatVND } from "@/lib/utils";

interface PublicStoreViewProps {
  data: ResolvedPublicStoreData;
}

function PublicStoreInnerView({ data }: PublicStoreViewProps) {
  const { store, activeOffers, activeProducts, categories, trust, contact, policies, paymentMethods, fulfillmentMethods } = data;
  const { addToCart, setIsCartOpen, totalItems, subtotal } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const searchInputRef = useRef<HTMLDivElement>(null);

  const brandColor = store.customization?.brand_color || "#2563eb";
  const accentColor = store.customization?.accent_color || "#3b82f6";

  // Filter products by category and search
  const filteredProducts = activeProducts.filter((product) => {
    // 1. Category match
    if (selectedCategory !== "ALL") {
      const matchCat = (product.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      if (!matchCat) return false;
    }

    // 2. Search query match
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchName = (product.name || "").toLowerCase().includes(query);
      const matchSku = (product.sku || "").toLowerCase().includes(query);
      const matchDesc = (product.description || "").toLowerCase().includes(query);
      if (!matchName && !matchSku && !matchDesc) return false;
    }

    return true;
  });

  const handleOpenSearch = () => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = searchInputRef.current?.querySelector("input");
    input?.focus();
  };

  const handleAddToCart = (p: Product) => {
    const productOffer: Offer = {
      id: p.id,
      organization_id: store.organization_id || store.owner_actor_id || "org_default",
      store_id: store.id || "store_default",
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
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans pb-24 selection:bg-blue-600 selection:text-white">
      {/* 1. PUBLIC HEADER */}
      <PublicStoreHeader
        storeName={store.store_name}
        storeSlug={store.slug || "auto"}
        brandColor={brandColor}
        onOpenSearch={handleOpenSearch}
      />

      {/* 2. STORE HERO & IDENTITY */}
      <PublicStoreHero
        storeName={store.store_name}
        storeSlug={store.slug || "auto"}
        logoUrl={store.logo_url}
        coverImageUrl={store.cover_image_url}
        description={store.description}
        actorType={data.actorType}
        location={data.contact.address || store.address}
        isVerified={data.isVerified}
        phone={data.contact.phone}
        brandColor={brandColor}
        accentColor={accentColor}
      />

      {/* MAIN COMMERCE CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* 3. SEARCH & 4. CATEGORIES */}
        <div ref={searchInputRef} className="space-y-3 pt-1">
          <PublicStoreSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalProductsCount={activeProducts.length}
          />

          <PublicStoreCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            brandColor={brandColor}
          />
        </div>

        {/* 5. ACTIVE OFFERS (Only when not searching or no category filter) */}
        {!searchQuery && selectedCategory === "ALL" && (
          <PublicStoreActiveOffers
            offers={activeOffers}
            storeSlug={store.slug || "auto"}
            brandColor={brandColor}
            accentColor={accentColor}
          />
        )}

        {/* 6. PRODUCTS & SERVICES GRID */}
        <PublicStoreProductGrid
          products={filteredProducts}
          offers={activeOffers}
          storeSlug={store.slug || "auto"}
          brandColor={brandColor}
          onAddToCart={handleAddToCart}
        />

        {/* 7. TRUST & REPUTATION SUMMARY */}
        <PublicStoreTrust
          trust={trust}
          isVerified={data.isVerified}
          brandColor={brandColor}
        />

        {/* 8. ABOUT STORE */}
        <PublicStoreAbout
          storeName={store.store_name}
          description={store.description}
          brandColor={brandColor}
        />

        {/* 9. CONTACT & POLICIES */}
        <PublicStoreContactPolicies
          storeName={store.store_name}
          contact={contact}
          policies={policies}
          paymentMethods={paymentMethods}
          fulfillmentMethods={fulfillmentMethods}
          brandColor={brandColor}
        />

        {/* 10. FOOTER */}
        <PublicStoreFooter storeName={store.store_name} />
      </main>

      {/* FLOATING MOBILE CART BUTTON */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-3 z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs transition-all cursor-pointer active:scale-98"
            style={{ backgroundColor: brandColor }}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-neutral-900 flex items-center justify-center font-black text-[11px]">
                {totalItems}
              </span>
              <span>Xem giỏ hàng</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{formatVND(subtotal)}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      <CartDrawer storeSlug={store.slug || "auto"} />
    </div>
  );
}

export function PublicStoreView({ data }: PublicStoreViewProps) {
  return (
    <CartProvider>
      <PublicStoreInnerView data={data} />
    </CartProvider>
  );
}
