"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  ArrowLeft,
  Share2,
  QrCode,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Wrench,
  Package,
  Sparkles,
  Utensils,
  CheckCircle2,
  Send,
  X,
  CreditCard,
  Building,
  ListOrdered,
  MapPin,
  Navigation,
  Loader2,
  Paperclip,
  FileDown,
  Globe,
  Phone,
  Store as StoreIcon,
  RotateCcw,
  Star,
  ArrowRight,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, getPhoneValidationError } from "@/lib/utils";
import { CartProvider, CartDrawer, useCart } from "@/components/storefront/cart-drawer";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";
import { Offer, OfferVariant, OfferItem, PaymentMethodType, FulfillmentMethodType, Store, ActorPaymentAccount } from "@/types";
import { ShippingCalculationService } from "@/lib/shipping/engine";
import { PaymentSettingsService } from "@/lib/services/payment-settings-service";
import { FulfillmentService } from "@/lib/services/fulfillment-service";
import { ProductAvailabilityService } from "@/lib/inventory/availability";
import { SellerMiniCard } from "@/components/storefront/seller-mini-card";
import { SellerTrustSummary } from "@/components/storefront/seller-trust-summary";
import { StorePoliciesModal } from "@/components/storefront/store-policies-modal";
import { RelatedProducts } from "@/components/storefront/related-products";
import { OtherActiveOffers } from "@/components/storefront/other-active-offers";
import { OfferPublicService } from "@/lib/storefront/offer-public-service";
import { SyncBridgeService } from "@/lib/db/sync-bridge";
import confetti from "canvas-confetti";

function DirectOfferContent() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.store_slug as string) || "auto";
  const offerSlug = params?.offer_slug as string;

  const { offers, store, organization, products, createOrder, shippingMethods, shippingZones, paymentAccounts } = useCommerceStore();
  const { addToCart } = useCart();

  // Server-side fallback state for public visitors on mobile / Zalo
  const [serverData, setServerData] = useState<{
    offer: Offer;
    store: Store;
    paymentAccounts: ActorPaymentAccount[];
    bankInfo?: {
      is_configured: boolean;
      bank_name: string;
      bank_short_name: string;
      bank_bin: string;
      account_number: string;
      account_name: string;
      qr_image_url?: string;
    };
  } | null>(null);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(true);

  // Fetch offer and store data from server if client localStorage does not have it
  useEffect(() => {
    let isMounted = true;
    const localOffer = offers.find((o) => o.slug === offerSlug);
    if (localOffer) {
      setIsLoadingServer(false);
      return;
    }

    setIsLoadingServer(true);
    fetch(`/api/storefront/offer?store_slug=${encodeURIComponent(storeSlug)}&offer_slug=${encodeURIComponent(offerSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.offer) {
          setServerData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch public offer from server:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingServer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [offerSlug, storeSlug, offers]);

  const effectiveOffer = offers.find((o) => o.slug === offerSlug) || serverData?.offer;
  const effectiveStore = (store && store.slug === storeSlug) ? store : (serverData?.store || store);
  const effectivePaymentAccounts = (paymentAccounts && paymentAccounts.length > 0) ? paymentAccounts : (serverData?.paymentAccounts || []);

  const offer = effectiveOffer;
  const currentStore = effectiveStore;

  const publicOffer = offer
    ? OfferPublicService.getPublicOffer({
        offerSlug,
        offers: [offer, ...offers],
        store: currentStore,
        organization,
        products,
      })
    : null;

  const [activeDisplayImage, setActiveDisplayImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<OfferVariant | undefined>(
    offer?.variants && offer.variants.length > 0 ? offer.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<"shipping" | "returns" | "warranty" | "payment">("shipping");

  const allDisplayImages = offer
    ? [offer.image_url, ...(offer.gallery || [])].filter((img): img is string => Boolean(img))
    : [];

  // Multi-Item Catalog Mode State
  const [menuQuantities, setMenuQuantities] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [showMenuCheckoutModal, setShowMenuCheckoutModal] = useState(false);

  // Checkout Form State for Catalog Offer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("VIETQR");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // GPS Geolocation State
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; map_url: string } | null>(null);

  // 1. Loading State
  if (isLoadingServer && !offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Đang tải thông tin ưu đãi...</p>
          <p className="text-xs text-neutral-400">Kết nối máy chủ và nạp dữ liệu bảo mật</p>
        </div>
      </div>
    );
  }

  // 2. Not Found State
  if (!offer || !currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center">
        <div className="space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Không tìm thấy sản phẩm/dịch vụ này
          </h2>
          <p className="text-xs text-neutral-500">
            Đường link có thể đã hết hạn hoặc người bán đã ngừng phát hành ưu đãi.
          </p>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang cửa hàng</span>
          </Link>
        </div>
      </div>
    );
  }

  // Handle DISCONTINUED product state with graceful UX (not generic 404)
  if (offer.product_status === "DISCONTINUED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center">
        <div className="space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto text-rose-600">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Sản phẩm này hiện không còn kinh doanh
          </h2>
          <p className="text-xs text-neutral-500">
            Nhà bán hàng đã ngừng phân phối hoặc chuyển sang model thế hệ mới. Bạn có thể tham khảo các mặt hàng khác tại cửa hàng.
          </p>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xem các sản phẩm khác tại cửa hàng</span>
          </Link>
        </div>
      </div>
    );
  }

  const isMenuMode = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 0);
  const currentPrice = selectedVariant ? selectedVariant.price : offer.price;
  const offerUrl = typeof window !== "undefined" ? window.location.href : `/${storeSlug}/o/${offerSlug}`;

  // Menu / Catalog items & calculation (Filtered by Offer out_of_stock_visibility setting)
  const allMenuItems: OfferItem[] = offer.items || [];
  const menuItems: OfferItem[] = allMenuItems.filter((item) =>
    ProductAvailabilityService.isOfferItemVisible(item, {
      out_of_stock_visibility: offer.out_of_stock_visibility || "HIDE",
    })
  );
  const menuCategories = ["ALL", ...Array.from(new Set(menuItems.map((i) => i.category || "Khác")))];

  const filteredMenuItems = menuItems.filter((i) => {
    if (activeCategory === "ALL") return true;
    return i.category === activeCategory;
  });

  const totalMenuItemsCount = Object.values(menuQuantities).reduce((a, b) => a + b, 0);
  const totalMenuAmount = menuItems.reduce((acc, it) => {
    const qty = menuQuantities[it.id] || 0;
    return acc + it.price * qty;
  }, 0);

  const handleUpdateItemQty = (itemId: string, delta: number) => {
    setMenuQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleBuyNow = () => {
    addToCart(offer, selectedVariant, quantity);
    router.push(`/${storeSlug}/checkout`);
  };

  // GPS Geolocation Handler
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Thiết bị hoặc trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
        setGpsCoords({ lat, lng, map_url: mapUrl });
        setIsLocatingGPS(false);

        // Auto-fill delivery address if empty or append
        if (!deliveryLocation.trim()) {
          setDeliveryLocation(`📍 Vị trí GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        let msg = "Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí trên trình duyệt.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Bạn đã từ chối quyền định vị. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.";
        }
        alert(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // Dynamic Shipping Calculation for Catalog Order Modal
  const selectedItemsForShipping = menuItems
    .filter((it) => (menuQuantities[it.id] || 0) > 0)
    .map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: menuQuantities[it.id],
      offer_type: "PRODUCT" as const,
    }));

  const catalogShippingCalc = ShippingCalculationService.calculate({
    store,
    items: selectedItemsForShipping,
    subtotal: totalMenuAmount,
    delivery_address: { address_line: deliveryLocation },
    selected_method_id: selectedShippingMethodId,
    shipping_methods: shippingMethods,
    shipping_zones: shippingZones,
  });

  const selectedCatalogShippingOption = catalogShippingCalc.selected_option;
  const isCatalogQuoteLater = selectedCatalogShippingOption?.is_quote_later === true;
  const catalogShippingFee = isCatalogQuoteLater ? 0 : catalogShippingCalc.final_shipping_fee;
  const finalMenuGrandTotal = totalMenuAmount + catalogShippingFee;

  const handleCompleteMenuOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalMenuItemsCount === 0) return;
    setIsSubmittingOrder(true);

    // Build order items array
    const selectedItemsForOrder = menuItems
      .filter((it) => (menuQuantities[it.id] || 0) > 0)
      .map((it) => ({
        offer: {
          ...offer,
          name: `${it.name} (${offer.name})`,
          price: it.price,
          cost_price: it.cost_price || it.price * 0.5,
        },
        quantity: menuQuantities[it.id],
      }));

    const order = createOrder({
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: {
        full_address: deliveryLocation || "Tại cơ sở / Theo định vị GPS",
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng,
        map_url: gpsCoords?.map_url,
      },
      items: selectedItemsForOrder,
      payment_method: paymentMethod,
      shipping_method_id: selectedCatalogShippingOption?.method_id,
      customer_notes: `${deliveryLocation ? `[Địa chỉ/Khu vực: ${deliveryLocation}] ` : ""}${gpsCoords ? `[GPS: ${gpsCoords.lat.toFixed(5)},${gpsCoords.lng.toFixed(5)}] ` : ""}${orderNotes}`,
    });

    SyncBridgeService.submitOrderToServer(order);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      router.push(`/${storeSlug}/order/${order.order_number}`);
    }, 600);
  };

  const avail = ProductAvailabilityService.computeAvailability({
    inventory_tracking: offer.inventory_tracking,
    availability_status: offer.availability_status,
    available_quantity: offer.available_quantity,
  });
  const isOutOfStock = avail === "OUT_OF_STOCK";
  const isLowStock = avail === "LOW_STOCK";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-32 text-neutral-900 dark:text-neutral-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{store.store_name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              title="QR Offer"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <CopyButton text={offerUrl} label="Share Offer" className="text-xs" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* ========================================================================= */}
        {/* MODE A: MULTI-ITEM CATALOG / PRICE-LIST OFFER                            */}
        {/* ========================================================================= */}
        {isMenuMode ? (
          <div className="space-y-6">
            {/* Catalog Header Card (Unified with Seller Trust & Brand) */}
            <div className="overflow-hidden rounded-3xl bg-linear-to-r from-neutral-900 via-neutral-800 to-indigo-950 text-white shadow-xl border border-white/10">
              {/* Unified Store Branding & Seller Trust Header Bar */}
              <div className="px-5 sm:px-6 py-3.5 bg-black/40 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Left: Identity, Verified Badge, Rating, Location */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {publicOffer?.seller_mini_card.logo_url || store.logo_url ? (
                      <img
                        src={publicOffer?.seller_mini_card.logo_url || store.logo_url}
                        alt={publicOffer?.seller_mini_card.seller_display_name || store.store_name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400">
                        <StoreIcon className="w-5 h-5" />
                      </div>
                    )}
                    {publicOffer?.seller_mini_card.is_verified && (
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                        title={publicOffer.seller_mini_card.badge_text}
                      >
                        <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white truncate">
                        {publicOffer?.seller_mini_card.seller_display_name || store.store_name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        ✓ {publicOffer?.seller_mini_card.badge_text || "Doanh nghiệp Xác thực"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-300 flex-wrap">
                      <span className="flex items-center gap-0.5 font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(publicOffer?.seller_mini_card.rating_average || 4.9).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{publicOffer?.seller_mini_card.transaction_count || 326} giao dịch</span>
                      <span>•</span>
                      <span>{publicOffer?.seller_mini_card.location_summary || "Hải Phòng"}</span>
                      {store.phone && (
                        <>
                          <span>•</span>
                          <a href={`tel:${store.phone}`} className="hover:text-emerald-300 transition-colors">
                            Hotline: <strong>{store.phone}</strong>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: CTA View Store */}
                <Link
                  href={`/${storeSlug}`}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/20 self-start sm:self-center cursor-pointer"
                >
                  <span>Xem Cửa Hàng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Catalog Title & Attachments */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>DANH MỤC & BẢNG GIÁ ĐẶT HÀNG TRỰC TIẾP</span>
                    </span>
                    <span className="text-xs text-neutral-400">● {menuItems.length} sản phẩm/dịch vụ</span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{offer.name}</h1>
                </div>

                {/* Catalog Attachments */}
                {offer.attachments && offer.attachments.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Tài Liệu Đính Kèm Của Bảng Giá ({offer.attachments.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {offer.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.file_type !== "LINK"}
                          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-between text-xs transition-all text-white group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {att.file_type === "LINK" ? (
                              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold text-neutral-100 group-hover:text-emerald-300 truncate">
                              {att.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 group-hover:underline shrink-0">
                            {att.file_size || "Tải về"} ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter Pills (if multiple categories) */}
            {menuCategories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-md"
                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    {cat === "ALL" ? "Tất cả sản phẩm/dịch vụ" : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Catalog Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenuItems.map((item) => {
                const qty = menuQuantities[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-3xl bg-white dark:bg-neutral-900 border transition-all flex gap-4 ${
                      qty > 0
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                        : "border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    {/* Item Image */}
                    {item.image_url && (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-100 dark:border-neutral-800">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Item Info & Actions */}
                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Item Variants tags if any */}
                        {item.variants && item.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.variants.map((v) => (
                              <span key={v.id} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                {v.name}: {formatVND(v.price)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Item Attachments if any */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {item.attachments.map((a) => (
                              <a
                                key={a.id}
                                href={a.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={a.file_type !== "LINK"}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline border border-amber-200"
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>{a.name} ↗</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatVND(item.price)}
                            {item.unit && <span className="text-[10px] text-neutral-400 font-normal">/{item.unit}</span>}
                          </span>
                          {item.compare_at_price && item.compare_at_price > item.price && (
                            <span className="text-[11px] text-neutral-400 line-through">
                              {formatVND(item.compare_at_price)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                          <button
                            onClick={() => handleUpdateItemQty(item.id, -1)}
                            disabled={qty === 0}
                            className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={`px-2 text-xs font-bold ${qty > 0 ? "text-emerald-600 font-black" : "text-neutral-400"}`}>
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateItemQty(item.id, 1)}
                            className="px-2.5 py-1 text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Order Bar for Catalog Mode */}
            {totalMenuItemsCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto animate-in slide-in-from-bottom-5">
                <div className="p-4 rounded-3xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xl flex items-center justify-between gap-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                      {totalMenuItemsCount}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-300 dark:text-neutral-600 font-medium">Tổng giá trị đã chọn:</p>
                      <p className="text-base font-black text-emerald-400 dark:text-emerald-600">
                        {formatVND(totalMenuAmount)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMenuCheckoutModal(true)}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>GỬI ĐƠN ĐẶT HÀNG</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Unified Store Branding & Seller Trust Header Bar */}
            <div className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Left: Identity, Verified Badge, Rating, Location */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {publicOffer?.seller_mini_card.logo_url || store.logo_url ? (
                    <img
                      src={publicOffer?.seller_mini_card.logo_url || store.logo_url}
                      alt={publicOffer?.seller_mini_card.seller_display_name || store.store_name}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Building className="w-5 h-5" />
                    </div>
                  )}
                  {publicOffer?.seller_mini_card.is_verified && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                      title={publicOffer.seller_mini_card.badge_text}
                    >
                      <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {publicOffer?.seller_mini_card.seller_display_name || store.store_name}
                    </h4>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                      ✓ {publicOffer?.seller_mini_card.badge_text || "Doanh nghiệp Xác thực"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 flex-wrap">
                    <span className="flex items-center gap-0.5 font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {(publicOffer?.seller_mini_card.rating_average || 4.9).toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{publicOffer?.seller_mini_card.transaction_count || 326} giao dịch</span>
                    <span>•</span>
                    <span>{publicOffer?.seller_mini_card.location_summary || "Hải Phòng"}</span>
                    {store.phone && (
                      <>
                        <span>•</span>
                        <a href={`tel:${store.phone}`} className="hover:text-blue-600 transition-colors">
                          Hotline: <strong>{store.phone}</strong>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: CTA View Store */}
              <Link
                href={`/${storeSlug}`}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all active:scale-95 self-start sm:self-center cursor-pointer"
              >
                <span>Xem Cửa Hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            {/* Image & Gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border flex items-center justify-center">
                {activeDisplayImage || offer.image_url ? (
                  <img
                    src={activeDisplayImage || offer.image_url}
                    alt={offer.name}
                    className="w-full h-full object-cover transition-all"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100/90 dark:bg-neutral-800/90">
                    <Package className="w-16 h-16 mb-2 opacity-40" />
                    <span className="text-xs font-medium opacity-60">Chưa có hình ảnh</span>
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails (Primary + Additional Photos) */}
              {allDisplayImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allDisplayImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDisplayImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        (activeDisplayImage || offer.image_url) === img
                          ? "border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                          : "border-neutral-200 dark:border-neutral-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offer Details & Purchasing Controls */}
            {(() => {
              const avail = ProductAvailabilityService.computeAvailability({
                inventory_tracking: offer.inventory_tracking,
                availability_status: offer.availability_status,
                available_quantity: offer.available_quantity,
              });
              const isOutOfStock = avail === "OUT_OF_STOCK";
              const isLowStock = avail === "LOW_STOCK";

              return (
                <div className="space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                        {offer.offer_type === "PRODUCT" ? "📦 SẢN PHẨM" : "🛠️ DỊCH VỤ"}
                      </span>
                      {isOutOfStock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white shadow-xs">
                          TẠM HẾT HÀNG
                        </span>
                      )}
                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          SẮP HẾT HÀNG (Còn {offer.available_quantity})
                        </span>
                      )}
                      {!isOutOfStock && !isLowStock && offer.inventory_tracking && (
                        <span className="text-[11px] text-emerald-600 font-semibold">● Còn hàng sẵn ({offer.available_quantity || "Nhiều"})</span>
                      )}
                    </div>

                    <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                      {offer.name}
                    </h1>

                    <div className="flex items-baseline gap-3 pt-1">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {formatVND(currentPrice)}
                      </span>
                      {offer.compare_at_price && offer.compare_at_price > currentPrice && (
                        <span className="text-sm text-neutral-400 line-through">
                          {formatVND(offer.compare_at_price)}
                        </span>
                      )}
                      {offer.service_unit && (
                        <span className="text-xs text-neutral-500">/{offer.service_unit}</span>
                      )}
                    </div>

                    {/* Variants Selection (if any) */}
                    {offer.variants && offer.variants.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          Chọn phân loại:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {offer.variants.map((v: OfferVariant) => (
                            <button
                              key={v.id}
                              disabled={isOutOfStock}
                              onClick={() => setSelectedVariant(v)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                selectedVariant?.id === v.id
                                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                              }`}
                            >
                              {v.name} ({formatVND(v.price)})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="pt-2 flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Số lượng:
                      </span>
                      <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900">
                        <button
                          disabled={isOutOfStock}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold">{quantity}</span>
                        <button
                          disabled={isOutOfStock}
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-2.5 py-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                      {offer.description}
                    </div>

                    {/* Attached Files & Documents */}
                    {offer.attachments && offer.attachments.length > 0 && (
                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tài Liệu & File Đính Kèm ({offer.attachments.length}):</span>
                        </div>
                        <div className="space-y-1.5">
                          {offer.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={att.file_type !== "LINK"}
                              className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between text-xs transition-all group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {att.file_type === "LINK" ? (
                                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                  <FileDown className="w-4 h-4 text-amber-600 shrink-0" />
                                )}
                                <span className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 truncate">
                                  {att.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-neutral-500 group-hover:underline shrink-0 flex items-center gap-1">
                                {att.file_size || "Tải về"} ↗
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-3">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => !isOutOfStock && addToCart(offer, selectedVariant, quantity)}
                      className={`py-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isOutOfStock
                          ? "border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                          : "border-neutral-900 dark:border-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-pointer"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isOutOfStock ? "TẠM HẾT HÀNG" : "Thêm Vào Giỏ"}</span>
                    </button>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => !isOutOfStock && handleBuyNow()}
                      className={`py-3 rounded-2xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                        isOutOfStock
                          ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed shadow-none"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 cursor-pointer"
                      }`}
                    >
                      <span>{isOutOfStock ? "HẾT HÀNG" : "Mua Ngay"}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

        {/* Store Policy Quick Badges */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex flex-wrap items-center justify-around gap-2 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setPolicyInitialTab("shipping");
              setShowPoliciesModal(true);
            }}
            className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 font-bold transition-colors cursor-pointer"
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Vận chuyển toàn quốc</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPolicyInitialTab("returns");
              setShowPoliciesModal(true);
            }}
            className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600" />
            <span>Đổi trả 7 ngày</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPolicyInitialTab("warranty");
              setShowPoliciesModal(true);
            }}
            className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 font-bold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Bảo hành chính hãng</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPolicyInitialTab("payment");
              setShowPoliciesModal(true);
            }}
            className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 font-bold transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>VietQR & COD</span>
          </button>
        </div>

        {/* Seller Trust Summary Block */}
        {publicOffer?.trust_summary && (
          <SellerTrustSummary
            sellerDisplayName={publicOffer.seller_mini_card.seller_display_name}
            sellerSlug={publicOffer.seller_mini_card.seller_slug}
            trustScore={publicOffer.trust_summary.trust_score}
            completionRate={publicOffer.trust_summary.completion_rate}
            onTimeRate={publicOffer.trust_summary.on_time_delivery_rate}
            completedTransactions={publicOffer.trust_summary.completed_transactions}
            memberSince={publicOffer.trust_summary.member_since}
          />
        )}

        {/* Related Products (Cross-Sell) */}
        {publicOffer?.related_products && publicOffer.related_products.length > 0 && (
          <RelatedProducts
            products={publicOffer.related_products}
            storeSlug={store.slug}
            storeName={store.store_name}
          />
        )}

        {/* Other Active Offers from Same Store */}
        {publicOffer?.other_active_offers && publicOffer.other_active_offers.length > 0 && (
          <OtherActiveOffers
            offers={publicOffer.other_active_offers}
            storeName={store.store_name}
          />
        )}
      </main>

      {/* Sticky Mobile Bottom Buy Bar (Single Product Offer) */}
      {!isMenuMode && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 p-3 z-40 flex items-center justify-between gap-3 shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          <div className="min-w-0">
            <p className="text-[10px] text-neutral-400 uppercase font-bold">Tổng tiền</p>
            <p className="text-sm font-black text-blue-600 dark:text-blue-400 truncate">
              {formatVND(currentPrice * quantity)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && addToCart(offer, selectedVariant, quantity)}
              className="px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all min-h-[40px]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Giỏ</span>
            </button>

            <button
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && handleBuyNow()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all min-h-[40px]"
            >
              <span>{isOutOfStock ? "HẾT HÀNG" : "Mua Ngay"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Policies Details Modal */}
      <StorePoliciesModal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
        policies={publicOffer?.policies || {}}
        storeName={store.store_name}
        initialTab={policyInitialTab}
      />

      {/* ========================================================================= */}
      {/* INSTANT CHECKOUT MODAL WITH GEOLOCATION GPS                               */}
      {/* ========================================================================= */}
      {showMenuCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Xác Nhận Đặt Hàng ({totalMenuItemsCount} sản phẩm/dịch vụ)
                </h3>
              </div>
              <button
                onClick={() => setShowMenuCheckoutModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Items Summary List */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Sản phẩm / Dịch vụ đã chọn:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {menuItems
                  .filter((it) => (menuQuantities[it.id] || 0) > 0)
                  .map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-xs">
                      <span>
                        <strong>{menuQuantities[it.id]}x</strong> {it.name}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {formatVND(it.price * menuQuantities[it.id])}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-xs font-black">
                <span>Tổng cộng:</span>
                <span className="text-sm text-emerald-600">{formatVND(totalMenuAmount)}</span>
              </div>
            </div>

            {/* Customer Information Form */}
            <form onSubmit={handleCompleteMenuOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Họ tên người đặt hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Nam"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Số điện thoại *
                    </label>
                    {customerPhone && !phoneError && (
                      <span className="text-[10px] font-bold text-emerald-600">✓ Hợp lệ</span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^\d+]/g, "");
                      setCustomerPhone(cleaned);
                      setPhoneError(getPhoneValidationError(cleaned));
                    }}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border text-neutral-900 dark:text-neutral-100 font-mono font-bold transition-all ${
                      phoneError
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500"
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[10px] font-medium text-red-500 mt-1">{phoneError}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Địa chỉ / Bàn / Khu vực *
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="123 Lê Lợi hoặc Bàn 04..."
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* GPS Location Button & Badge */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Định Vị Điểm Giao Nhận Hàng (GPS):</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetGPSLocation}
                    disabled={isLocatingGPS}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {isLocatingGPS ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Đang lấy GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3" />
                        <span>📍 Lấy vị trí hiện tại</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsCoords ? (
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-1 border-t border-emerald-200/60 dark:border-emerald-800">
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Đã gắn tọa độ: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</span>
                    </span>
                    <a
                      href={gpsCoords.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                    >
                      <span>Xem Google Maps ↗</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Bấm để tự động lấy tọa độ định vị GPS thiết bị của bạn giúp shipper/người bán giao hàng chính xác.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Ghi chú cho người bán (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Yêu cầu quy cách đóng gói, xuất hóa đơn, thời gian nhận..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Shipping Method Options */}
              {catalogShippingCalc.requires_shipping && (
                <div className="space-y-2">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    Phương thức vận chuyển & Giao hàng
                  </label>
                  <div className="space-y-2">
                    {catalogShippingCalc.available_options.map((option) => {
                      const isSelected = (selectedCatalogShippingOption?.method_id === option.method_id) || (!selectedShippingMethodId && option === catalogShippingCalc.selected_option);
                      return (
                        <label
                          key={option.method_id}
                          onClick={() => setSelectedShippingMethodId(option.method_id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 font-bold"
                              : "border-neutral-200 dark:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0">
                              {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-neutral-900 dark:text-neutral-100">
                                <span>{option.name}</span>
                                {option.estimated_delivery && (
                                  <span className="text-[10px] text-neutral-400 font-normal ml-1">
                                    ({option.estimated_delivery})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs shrink-0 font-bold">
                            {option.is_quote_later ? (
                              <span className="text-amber-600 dark:text-amber-400 text-[11px]">Báo sau</span>
                            ) : option.fee === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">0đ (Miễn phí)</span>
                            ) : (
                              <span className="text-neutral-800 dark:text-neutral-200">{formatVND(option.fee)}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Payment Method Resolution */}
              {(() => {
                const effectivePayment = PaymentSettingsService.getEffectivePaymentMethods(store, offer, paymentAccounts);
                const activeMethods = effectivePayment.methods;
                const depositMethod = activeMethods.find((m) => m.type === "DEPOSIT");
                const payLaterMethod = activeMethods.find((m) => m.type === "PAY_LATER");

                const depositCalc = paymentMethod === "DEPOSIT" && depositMethod?.deposit
                  ? PaymentSettingsService.calculateDepositAmount(
                      finalMenuGrandTotal,
                      depositMethod.deposit.type,
                      depositMethod.deposit.percentage,
                      depositMethod.deposit.fixed_amount
                    )
                  : null;

                const dueDate = paymentMethod === "PAY_LATER" && payLaterMethod?.pay_later
                  ? PaymentSettingsService.calculatePaymentDueDate(
                      new Date().toISOString(),
                      (payLaterMethod.pay_later.terms as any) || "NET_30",
                      payLaterMethod.pay_later.days || 30
                    )
                  : null;

                return (
                  <div className="space-y-2">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Phương thức thanh toán ({activeMethods.length} lựa chọn)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeMethods.map((m) => {
                        const isSelected = paymentMethod === m.type;
                        return (
                          <button
                            key={m.type}
                            type="button"
                            onClick={() => setPaymentMethod(m.type)}
                            className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold"
                                : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                            }`}
                          >
                            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs block font-bold">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate">
                                {m.description || "Thanh toán đơn hàng"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Deposit info banner */}
                    {depositCalc && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-blue-900 dark:text-blue-200">
                          <span>Số tiền đặt cọc cần thanh toán ngay:</span>
                          <span className="text-blue-600 dark:text-blue-400">{formatVND(depositCalc.depositPayable)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-500">
                          <span>Số tiền còn lại thanh toán khi nhận hàng:</span>
                          <span>{formatVND(depositCalc.remainingBalance)}</span>
                        </div>
                      </div>
                    )}

                    {/* Pay later info banner */}
                    {dueDate && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                        <span>Hạn thanh toán công nợ:</span>
                        <span className="font-bold">{new Date(dueDate).toLocaleDateString("vi-VN")}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Order Total Breakdown */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Tiền hàng (Tạm tính):</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatVND(totalMenuAmount)}</span>
                </div>
                {catalogShippingCalc.requires_shipping && (
                  <div className="flex justify-between text-neutral-500">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold">
                      {isCatalogQuoteLater ? (
                        <span className="text-amber-600">Báo phí sau</span>
                      ) : catalogShippingFee === 0 ? (
                        <span className="text-emerald-600">0đ (Miễn phí)</span>
                      ) : (
                        <span className="text-neutral-800 dark:text-neutral-200">{formatVND(catalogShippingFee)}</span>
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t flex justify-between items-center font-black text-sm">
                  <span>Tổng thanh toán:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {isCatalogQuoteLater ? `${formatVND(totalMenuAmount)} + Phí ship` : formatVND(finalMenuGrandTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingOrder
                      ? "Đang gửi đơn..."
                      : isCatalogQuoteLater
                      ? "GỬI YÊU CẦU ĐẶT HÀNG (BÁO PHÍ SAU)"
                      : `HOÀN TẤT ĐẶT HÀNG (${formatVND(finalMenuGrandTotal)})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer storeSlug={storeSlug} />

      {/* QR MODAL */}
      {showQR && (
        <QRModal
          isOpen={true}
          onClose={() => setShowQR(false)}
          url={offerUrl}
          title={offer.name}
          subtitle={isMenuMode ? `${menuItems.length} sản phẩm trong danh mục` : formatVND(currentPrice)}
        />
      )}
    </div>
  );
}

export default function DirectOfferPage() {
  return (
    <CartProvider>
      <DirectOfferContent />
    </CartProvider>
  );
}
