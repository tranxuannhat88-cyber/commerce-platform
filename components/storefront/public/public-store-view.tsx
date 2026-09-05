"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
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
import { useCommerceStore } from "@/lib/db/store";
import { Product, Offer, Store } from "@/types";
import { formatVND } from "@/lib/utils";

interface PublicStoreViewProps {
  initialData?: ResolvedPublicStoreData | null;
  storeSlug: string;
}

function PublicStoreInnerView({ initialData, storeSlug }: PublicStoreViewProps) {
  const { store: clientStore, organization: clientOrg, products: clientProducts, offers: clientOffers, reviews: clientReviews, orders: clientOrders } = useCommerceStore();
  const { addToCart, setIsCartOpen, totalItems, subtotal } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Determine effective store data (SSR initialData or live client state)
  const effectiveData: ResolvedPublicStoreData | null = useMemo(() => {
    if (initialData) return initialData;

    // Fallback to client-side store if matches slug or is active
    if (clientStore && (clientStore.slug === storeSlug || clientStore.id === storeSlug || storeSlug === "auto" || !initialData)) {
      if (!clientStore.store_name && !clientStore.slug) return null;

      const isOrg = clientStore.owner_actor_type === "ORGANIZATION" || Boolean(clientOrg?.id);
      const activeProducts = (clientProducts || []).filter(
        (p) => p.product_status !== "DISCONTINUED" && p.product_status !== "HIDDEN"
      );
      const activeOffers = (clientOffers || []).filter(
        (o) => o.status === "ACTIVE" && (o.visibility || "PUBLIC") === "PUBLIC"
      );

      const categoryMap = new Map<string, number>();
      activeProducts.forEach((p) => {
        const catName = p.category?.trim() || "Chung";
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
      });
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        id: name,
        name,
        count,
      }));

      const completedCount = (clientOrders || []).filter(
        (o) => o.order_status === "COMPLETED" || o.payment?.payment_status === "PAID"
      ).length;

      const pubReviews = (clientReviews || []).filter((r) => r.status === "PUBLISHED");
      const reviewCount = pubReviews.length;
      let ratingAvg: number | null = null;
      if (reviewCount > 0) {
        const totalScore = pubReviews.reduce((sum, r) => sum + (r.overall_rating || 5), 0);
        ratingAvg = Number((totalScore / reviewCount).toFixed(1));
      }

      const pubSettings = clientStore.public_settings;
      const policySettings = clientStore.policy_settings;

      const paymentMethods: string[] = [];
      if (clientStore.advanced_payment_settings?.enabled_methods?.length) {
        paymentMethods.push(...clientStore.advanced_payment_settings.enabled_methods);
      } else {
        if (clientStore.payment_settings?.enable_bank_transfer || clientStore.payment_settings?.bank_account_no) paymentMethods.push("VIETQR");
        if (clientStore.payment_settings?.enable_cod !== false) paymentMethods.push("COD");
      }

      const fulfillmentMethods: string[] = [];
      if (clientStore.advanced_fulfillment_settings?.enabled_methods?.length) {
        fulfillmentMethods.push(...clientStore.advanced_fulfillment_settings.enabled_methods);
      } else {
        if (clientStore.shipping_settings?.shipping_enabled !== false) fulfillmentMethods.push("DELIVERY");
        if (clientStore.shipping_settings?.enable_store_pickup) fulfillmentMethods.push("STORE_PICKUP");
      }

      return {
        store: clientStore,
        actorType: isOrg ? "ORGANIZATION" : "PERSONAL",
        actorDisplayName: isOrg ? clientOrg?.name || clientStore.store_name : "Cá nhân",
        isVerified: isOrg ? clientOrg?.verification_status === "VERIFIED" : clientStore.verification_status === "VERIFIED",
        activeOffers,
        activeProducts,
        categories,
        trust: {
          hasRealTrustData: reviewCount > 0 || completedCount > 0,
          ratingAverage: ratingAvg,
          ratingCount: reviewCount,
          completedTransactionsCount: completedCount,
          verifiedReviewCount: reviewCount,
        },
        contact: {
          phone: pubSettings?.show_business_phone !== false ? (pubSettings?.public_contact_phone || clientStore.phone || undefined) : undefined,
          email: pubSettings?.show_business_email !== false ? (pubSettings?.public_business_email || clientStore.email || undefined) : undefined,
          address: pubSettings?.show_full_address !== false ? (clientStore.address || undefined) : undefined,
          zaloPhone: clientStore.phone || pubSettings?.public_contact_phone || undefined,
          websiteUrl: pubSettings?.show_website !== false ? (pubSettings?.website_url || undefined) : undefined,
        },
        policies: {
          shippingPolicy: policySettings?.shipping_policy?.trim() || undefined,
          returnPolicy: policySettings?.return_policy?.trim() || undefined,
          warrantyPolicy: policySettings?.warranty_policy?.trim() || undefined,
          paymentTerms: policySettings?.payment_terms?.trim() || undefined,
        },
        paymentMethods,
        fulfillmentMethods,
      };
    }

    return null;
  }, [initialData, clientStore, clientOrg, clientProducts, clientOffers, clientReviews, clientOrders, storeSlug]);

  if (!effectiveData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl mb-4">
          🏬
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Cửa hàng không tồn tại</h2>
        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
          Đường dẫn cửa hàng này không tồn tại hoặc đã được thay đổi. Vui lòng kiểm tra lại đường link.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
        >
          Về Trang Chủ
        </Link>
      </div>
    );
  }

  const { store, activeOffers, activeProducts, categories, trust, contact, policies, paymentMethods, fulfillmentMethods } = effectiveData;
  const brandColor = store.customization?.brand_color || "#00A88F";
  const accentColor = store.customization?.accent_color || "#00D1C2";

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
        storeSlug={store.slug || storeSlug || "auto"}
        brandColor={brandColor}
        onOpenSearch={handleOpenSearch}
      />

      {/* 2. STORE HERO & IDENTITY */}
      <PublicStoreHero
        storeName={store.store_name}
        storeSlug={store.slug || storeSlug || "auto"}
        logoUrl={store.logo_url}
        coverImageUrl={store.cover_image_url}
        description={store.description}
        actorType={effectiveData.actorType}
        location={effectiveData.contact.address || store.address}
        isVerified={effectiveData.isVerified}
        phone={effectiveData.contact.phone}
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
            storeSlug={store.slug || storeSlug || "auto"}
            brandColor={brandColor}
            accentColor={accentColor}
          />
        )}

        {/* 6. PRODUCTS & SERVICES GRID */}
        <PublicStoreProductGrid
          products={filteredProducts}
          offers={activeOffers}
          storeSlug={store.slug || storeSlug || "auto"}
          brandColor={brandColor}
          onAddToCart={handleAddToCart}
        />

        {/* 7. TRUST & REPUTATION SUMMARY */}
        <PublicStoreTrust
          trust={trust}
          isVerified={effectiveData.isVerified}
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
      <CartDrawer storeSlug={store.slug || storeSlug || "auto"} />
    </div>
  );
}

export function PublicStoreView({ initialData, storeSlug }: PublicStoreViewProps) {
  return (
    <CartProvider>
      <PublicStoreInnerView initialData={initialData} storeSlug={storeSlug} />
    </CartProvider>
  );
}
