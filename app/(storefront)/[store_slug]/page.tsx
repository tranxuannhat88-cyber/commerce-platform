"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND } from "@/lib/utils";
import { CartProvider, CartDrawer, useCart } from "@/components/storefront/cart-drawer";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";
import { Offer } from "@/types";
import { ProductAvailabilityService } from "@/lib/inventory/availability";

function StorefrontContent() {
  const params = useParams();
  const storeSlug = (params?.store_slug as string) || "2k-store";
  const { store, offers, categories } = useCommerceStore();
  const { addToCart, setIsCartOpen, totalItems } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStoreQR, setShowStoreQR] = useState(false);

  // 1. Filter visible offers on storefront based on product & store visibility settings
  const visibleOffers = offers.filter((o) =>
    ProductAvailabilityService.isStorefrontVisible(o, store.product_visibility_settings)
  );

  // 2. Sort available products first (IN_STOCK -> LOW_STOCK -> OUT_OF_STOCK at the end)
  const sortedOffers = ProductAvailabilityService.sortStorefrontProducts(visibleOffers);

  const filteredOffers = sortedOffers.filter((o) => {
    const matchCat = selectedCategory === "ALL" || o.category_id === selectedCategory;
    const matchSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const storeUrl = typeof window !== "undefined" ? window.location.href : `/${storeSlug}`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Sticky Mobile/Desktop Storefront Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              2K
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 truncate max-w-[180px] sm:max-w-xs">
                {store.store_name}
              </h1>
              <p className="text-[10px] text-emerald-600 font-medium">● Đang mở cửa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStoreQR(true)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              title="Chia sẻ mã QR"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <CopyButton text={storeUrl} label="Share" className="text-xs" />

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Giỏ hàng</span>
              {totalItems > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white text-blue-700 rounded-full text-[10px] font-black">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Store Banner & Brand Info */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white shadow-lg">
          <div className="relative z-10 p-6 md:p-8 space-y-3 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md">
              Cửa Hàng Chính Hãng
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {store.store_name}
            </h2>
            <p className="text-xs md:text-sm text-neutral-300">
              {store.description || "Giải pháp cung cấp vật tư & dịch vụ chất lượng cao."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
              {store.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{store.phone}</span>
                </span>
              )}
              {store.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{store.address}</span>
                </span>
              )}
            </div>
          </div>

          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Categories & Search */}
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === "ALL"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              Tất cả ({visibleOffers.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm sản phẩm / dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {filteredOffers.map((offer) => {
            const avail = ProductAvailabilityService.computeAvailability({
              inventory_tracking: offer.inventory_tracking,
              availability_status: offer.availability_status,
              available_quantity: offer.available_quantity,
            });
            const isOutOfStock = avail === "OUT_OF_STOCK";
            const isLowStock = avail === "LOW_STOCK";

            return (
              <div
                key={offer.id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isOutOfStock
                    ? "border-neutral-200/60 dark:border-neutral-800 opacity-80"
                    : "border-neutral-200/80 dark:border-neutral-800"
                }`}
              >
                <div>
                  <Link href={`/${storeSlug}/o/${offer.slug}`} className="block relative aspect-16/9 overflow-hidden group">
                    <img
                      src={offer.image_url || "https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600"}
                      alt={offer.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? "grayscale-30" : ""
                      }`}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900/80 text-white backdrop-blur-md">
                        {offer.offer_type === "PRODUCT" ? "📦 Sản phẩm" : "🛠️ Dịch vụ"}
                      </span>
                      {isOutOfStock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white shadow-xs">
                          Tạm Hết Hàng
                        </span>
                      )}
                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Sắp hết ({offer.available_quantity})
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 space-y-1.5">
                    <Link href={`/${storeSlug}/o/${offer.slug}`}>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 line-clamp-1">
                        {offer.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {offer.short_description || offer.description}
                    </p>

                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {formatVND(offer.price)}
                      </span>
                      {offer.compare_at_price && offer.compare_at_price > offer.price && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatVND(offer.compare_at_price)}
                        </span>
                      )}
                      {offer.service_unit && (
                        <span className="text-[11px] text-neutral-500">/{offer.service_unit}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    disabled={isOutOfStock}
                    onClick={() => !isOutOfStock && addToCart(offer, offer.variants?.[0], 1)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                      isOutOfStock
                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-300 dark:border-neutral-700"
                        : "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 cursor-pointer"
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>
                      {isOutOfStock
                        ? "TẠM HẾT HÀNG"
                        : offer.offer_type === "PRODUCT"
                        ? "Thêm vào giỏ"
                        : "Chọn dịch vụ này"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Drawer Component */}
      <CartDrawer storeSlug={storeSlug} />

      {/* QR MODAL */}
      {showStoreQR && (
        <QRModal
          isOpen={true}
          onClose={() => setShowStoreQR(false)}
          url={storeUrl}
          title="Mã QR Cửa Hàng"
          subtitle={store.store_name}
        />
      )}
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
