"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Share2,
  QrCode,
  Tag,
  Check,
  Package,
  Wrench,
  Search,
  ExternalLink,
  Plus,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Building2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND } from "@/lib/utils";
import { CartProvider, CartDrawer, useCart } from "@/components/storefront/cart-drawer";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreActiveOffers } from "@/components/storefront/store-active-offers";
import { SellerTrustSummary } from "@/components/storefront/seller-trust-summary";
import { StorePoliciesModal } from "@/components/storefront/store-policies-modal";
import { StorefrontService } from "@/lib/storefront/storefront-service";
import { TemplateEngine } from "@/components/storefront/templates/template-engine";
import { TemplateEntitlementService } from "@/lib/templates/entitlement";
import { Store, Offer } from "@/types";

function StorefrontContent() {
  const params = useParams();
  const storeSlug = (params?.store_slug as string) || "auto";
  const { store, organization, offers, categories, products } = useCommerceStore();
  const { addToCart, setIsCartOpen, totalItems, subtotal } = useCart();

  const [serverStore, setServerStore] = useState<Store | null>(null);
  const [serverOffers, setServerOffers] = useState<Offer[]>([]);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (store && store.slug === storeSlug) {
      setIsLoadingServer(false);
      return;
    }

    setIsLoadingServer(true);
    Promise.all([
      fetch(`/api/sync/store?slug=${encodeURIComponent(storeSlug)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/sync/offers?store_slug=${encodeURIComponent(storeSlug)}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([storeRes, offersRes]) => {
        if (!isMounted) return;
        if (storeRes && storeRes.success && storeRes.store) {
          setServerStore(storeRes.store);
        }
        if (offersRes && offersRes.success && offersRes.offers) {
          setServerOffers(offersRes.offers);
        }
      })
      .catch((err) => {
        console.error("Error fetching public store from server:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingServer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [storeSlug, store]);

  const effectiveStore = (store && store.slug === storeSlug) ? store : (serverStore || store);
  const effectiveOffers = (offers && offers.length > 0) ? offers : serverOffers;

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<"shipping" | "returns" | "warranty" | "payment">("shipping");

  const storefrontData = StorefrontService.getPublicStorefront({
    store: effectiveStore,
    organization,
    offers: effectiveOffers,
    categories,
    products,
  });

  if (isLoadingServer && !effectiveStore?.slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Đang tải cửa hàng trực tuyến...</p>
          <p className="text-xs text-neutral-400">Kết nối danh mục sản phẩm và ưu đãi</p>
        </div>
      </div>
    );
  }

  if (!effectiveStore?.slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
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

  const activeTemplate = TemplateEntitlementService.getTemplateByIdOrCode(effectiveStore.active_template_id);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-28 text-neutral-900 dark:text-neutral-100">
      {/* DYNAMIC STORE TEMPLATE ENGINE */}
      <TemplateEngine
        template={activeTemplate}
        store={effectiveStore}
        organization={organization}
        products={products.filter((p) => p.product_status === "ACTIVE")}
        offers={effectiveOffers}
        categories={categories}
        customization={effectiveStore.customization}
        storeSlug={storeSlug}
        onAddToCart={(p) => {
          const productOffer: import("@/types").Offer = {
            id: p.id,
            organization_id: effectiveStore.organization_id || effectiveStore.owner_actor_id || "org_default",
            store_id: effectiveStore.id || "store_default",
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
      />

      {/* 3. FLOATING BOTTOM CART BAR ON MOBILE */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-3 z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-between font-bold text-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-[11px]">
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

      {/* Policies Details Modal */}
      <StorePoliciesModal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
        policies={storefrontData.policies}
        storeName={storefrontData.store_name}
        initialTab={policyInitialTab}
      />

      {/* Cart Drawer Component */}
      <CartDrawer storeSlug={storeSlug} />
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <CartProvider>
      <StorefrontContent />
    </CartProvider>
  );
}
