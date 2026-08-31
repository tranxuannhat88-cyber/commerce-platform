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

  const filteredProducts = storefrontData.products.filter((p) => {
    const matchCat =
      selectedCategory === "ALL" ||
      p.category_id === selectedCategory ||
      (categories.find((c) => c.id === selectedCategory)?.name === p.category_id);
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-28 text-neutral-900 dark:text-neutral-100">
      {/* 1. STOREFRONT HEADER */}
      <StoreHeader storefront={storefrontData} />

      {/* 2. MAIN STORE CONTENT */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* Active Offers Section */}
        {storefrontData.active_offers.length > 0 && (
          <StoreActiveOffers offers={storefrontData.active_offers} />
        )}

        {/* Catalog Navigation & Search */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Danh Mục Sản Phẩm & Dịch Vụ</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Khám phá toàn bộ giải pháp kỹ thuật & cơ khí từ {storefrontData.store_name}
              </p>
            </div>

            {/* Realtime Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, mã SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
              }`}
            >
              Tất Cả ({storefrontData.products.length})
            </button>

            {storefrontData.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {cat.name} ({cat.product_count})
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <Package className="w-10 h-10 text-neutral-400 mx-auto" />
            <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
              Không tìm thấy sản phẩm phù hợp
            </h4>
            <p className="text-xs text-neutral-500">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((p) => {
              const isOutOfStock = !p.is_available || p.availability_status === "OUT_OF_STOCK";

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 overflow-hidden flex flex-col justify-between p-3.5 shadow-2xs hover:shadow-lg transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="relative w-full aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
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
                          <span className="px-2.5 py-1 rounded-xl bg-neutral-900 text-white font-black text-[10px] uppercase shadow-md">
                            TẠM HẾT HÀNG
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {p.sku && (
                        <span className="text-[10px] font-mono text-neutral-400 block truncate">
                          SKU: {p.sku}
                        </span>
                      )}
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="font-black text-sm sm:text-base text-blue-600 dark:text-blue-400">
                          {formatVND(p.price)}
                        </span>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                          <span className="text-[11px] text-neutral-400 line-through">
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
                          organization_id: store.organization_id || store.owner_actor_id,
                          store_id: store.id,
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
                      className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isOutOfStock
                          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                          : "bg-neutral-900 hover:bg-blue-600 text-white dark:bg-neutral-100 dark:hover:bg-blue-600 dark:text-neutral-900 dark:hover:text-white shadow-sm active:scale-95"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isOutOfStock ? "Tạm Hết Hàng" : "Thêm Vào Giỏ"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. STORE POLICIES BADGES */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Chính Sách & Cam Kết Dịch Vụ
            </h3>
            <button
              type="button"
              onClick={() => setShowPoliciesModal(true)}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Chi Tiết Chính Sách
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setPolicyInitialTab("shipping");
                setShowPoliciesModal(true);
              }}
              className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-left space-y-1 hover:border-blue-500 transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4 text-blue-600" />
              <p className="font-bold text-neutral-900 dark:text-neutral-100">Giao Hàng</p>
              <p className="text-[10px] text-neutral-500 line-clamp-1">Toàn quốc, 1-3 ngày</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPolicyInitialTab("returns");
                setShowPoliciesModal(true);
              }}
              className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-left space-y-1 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <p className="font-bold text-neutral-900 dark:text-neutral-100">Đổi Trả</p>
              <p className="text-[10px] text-neutral-500 line-clamp-1">7 ngày đổi mới</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPolicyInitialTab("warranty");
                setShowPoliciesModal(true);
              }}
              className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-left space-y-1 hover:border-purple-500 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <p className="font-bold text-neutral-900 dark:text-neutral-100">Bảo Hành</p>
              <p className="text-[10px] text-neutral-500 line-clamp-1">Chính hãng 12-24 tháng</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPolicyInitialTab("payment");
                setShowPoliciesModal(true);
              }}
              className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 text-left space-y-1 hover:border-amber-500 transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-amber-600" />
              <p className="font-bold text-neutral-900 dark:text-neutral-100">Thanh Toán</p>
              <p className="text-[10px] text-neutral-500 line-clamp-1">VietQR, COD, VAT</p>
            </button>
          </div>
        </div>

        {/* 4. SELLER REPUTATION SUMMARY */}
        <SellerTrustSummary
          sellerDisplayName={storefrontData.store_name}
          sellerSlug={storefrontData.slug}
          trustScore={storefrontData.seller_reputation.trust_score}
          completionRate={storefrontData.seller_reputation.completion_rate}
          onTimeRate={storefrontData.seller_reputation.on_time_delivery_rate}
          completedTransactions={storefrontData.seller_reputation.completed_transactions}
          memberSince="Tháng 1, 2026"
        />
      </main>

      {/* Floating Bottom Cart Bar on Mobile */}
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
