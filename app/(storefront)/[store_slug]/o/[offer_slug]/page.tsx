"use client";

import { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  Send,
  X,
  CreditCard,
  Building2,
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
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, getPhoneValidationError } from "@/lib/utils";
import { CartProvider, CartDrawer, useCart } from "@/components/storefront/cart-drawer";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";
import {
  Offer,
  OfferVariant,
  OfferItem,
  PaymentMethodType,
  FulfillmentMethodType,
  Store,
  ActorPaymentAccount,
  Product,
  Organization,
  PersonalActor,
} from "@/types";
import { UserIdentity } from "@/lib/auth/types";
import { ShippingCalculationService } from "@/lib/shipping/engine";
import { PaymentSettingsService } from "@/lib/services/payment-settings-service";
import { FulfillmentService } from "@/lib/services/fulfillment-service";
import { ProductAvailabilityService } from "@/lib/inventory/availability";
import { OfferHeader } from "@/components/storefront/offer-header";
import { OfferPolicySummary } from "@/components/storefront/offer-policy-summary";
import { SellerTrustSummary } from "@/components/storefront/seller-trust-summary";
import { StorePoliciesModal } from "@/components/storefront/store-policies-modal";
import { OtherActiveOffers } from "@/components/storefront/other-active-offers";
import { OfferPublicService } from "@/lib/storefront/offer-public-service";
import confetti from "canvas-confetti";

interface ResolvedItem {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  unit?: string;
  description?: string;
  image_url?: string;
  category?: string;
  availability_status?: string;
  available_quantity?: number;
  is_available?: boolean;
  inventory_tracking?: boolean;
  variants?: OfferVariant[];
  attachments?: import("@/types").OfferAttachment[];
}

function DirectOfferContent() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.store_slug as string) || "auto";
  const offerSlug = (params?.offer_slug as string) || "";

  const {
    offers,
    store,
    products,
    organization,
    personalActor,
    currentUser,
    paymentAccounts,
    shippingMethods,
    shippingZones,
    createOrder,
    orders,
  } = useCommerceStore();

  const { addToCart } = useCart();

  // Server-side fallback state for public visitors on mobile / Zalo
  const [serverData, setServerData] = useState<{
    offer: Offer;
    store: Store;
    sellerProfile?: {
      actor_id?: string;
      actor_type?: "PERSONAL" | "ORGANIZATION";
      display_name?: string;
      full_name?: string;
      org_name?: string;
      avatar_url?: string;
      phone?: string;
      email?: string;
    };
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
    const localOffer = offers.find((o) => o.slug === offerSlug || o.id === offerSlug);
    if (localOffer) {
      setIsLoadingServer(false);
      return;
    }

    setIsLoadingServer(true);
    fetch(
      `/api/storefront/offer?store_slug=${encodeURIComponent(storeSlug)}&offer_slug=${encodeURIComponent(offerSlug)}`
    )
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

  const effectiveOffer = offers.find((o) => o.slug === offerSlug || o.id === offerSlug) || serverData?.offer;
  const effectiveStore = store && store.slug === storeSlug ? store : serverData?.store || store;
  const effectivePaymentAccounts =
    paymentAccounts && paymentAccounts.length > 0 ? paymentAccounts : serverData?.paymentAccounts || [];

  const offer = effectiveOffer;
  const currentStore = effectiveStore;

  const sellerInfo = serverData?.sellerProfile;
  const sellerFullName = sellerInfo?.full_name || sellerInfo?.display_name || (currentUser?.full_name && currentUser.full_name !== "Guest" ? currentUser.full_name : "");
  const sellerOrgName = sellerInfo?.org_name || (organization.name && organization.name !== "Chưa có tổ chức" ? organization.name : "");

  const effectiveOrganization: Organization = sellerOrgName
    ? { ...organization, name: sellerOrgName }
    : organization;

  const effectiveUser: UserIdentity | null = sellerFullName
    ? ({ ...(currentUser || {}), full_name: sellerFullName, id: sellerInfo?.actor_id || currentUser?.id || "usr_seller" } as UserIdentity)
    : currentUser;

  const effectivePersonalActor: PersonalActor = {
    ...personalActor,
    display_name: sellerFullName || personalActor.display_name,
  };

  const publicOffer = offer
    ? OfferPublicService.getPublicOffer({
        offerSlug,
        offers: [offer, ...offers],
        store: currentStore,
        organization: effectiveOrganization,
        personalActor: effectivePersonalActor,
        user: effectiveUser,
        products,
        orders,
      })
    : null;

  // Selected quantities for all items in the Offer: map of item_id / item_id__variant_id -> quantity
  // DEFAULT IS 0 (EMPTY OBJECT)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [showQR, setShowQR] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [policyInitialTab, setPolicyInitialTab] = useState<"shipping" | "returns" | "warranty" | "payment">("shipping");

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentMethodType>("DELIVERY");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("VIETQR");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // GPS Geolocation State
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; map_url: string } | null>(null);

  // Resolve all items in this Offer (whether single product or multi-item catalog)
  const resolvedItems: ResolvedItem[] = useMemo(() => {
    if (!offer) return [];

    if (offer.items && offer.items.length > 0) {
      return offer.items.map((item) => {
        const matchingProduct = products.find(
          (p) => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase()
        );
        const resolvedImg = item.image_url || matchingProduct?.image_url || item.gallery?.[0] || matchingProduct?.gallery?.[0];
        const resolvedVariants = (item.variants && item.variants.length > 0)
          ? item.variants
          : (matchingProduct?.variants && matchingProduct.variants.length > 0)
          ? matchingProduct.variants
          : (offer.variants || []);

        return {
          id: item.id,
          name: item.name,
          price: item.price,
          compare_at_price: item.compare_at_price,
          unit: item.unit || matchingProduct?.unit,
          description: item.description || matchingProduct?.description,
          image_url: resolvedImg,
          category: item.category || matchingProduct?.category,
          availability_status: item.availability_status || matchingProduct?.availability_status || "IN_STOCK",
          available_quantity: item.available_quantity ?? matchingProduct?.available_quantity,
          inventory_tracking: item.inventory_tracking ?? matchingProduct?.inventory_tracking,
          variants: resolvedVariants,
          attachments: item.attachments || matchingProduct?.attachments,
        };
      });
    }

    // Single item offer
    const matchingProduct = products.find(
      (p) => p.id === offer.id || p.name.toLowerCase() === offer.name.toLowerCase()
    );
    const resolvedImg = offer.image_url || matchingProduct?.image_url || offer.gallery?.[0] || matchingProduct?.gallery?.[0];
    const resolvedVariants = (offer.variants && offer.variants.length > 0)
      ? offer.variants
      : (matchingProduct?.variants && matchingProduct.variants.length > 0)
      ? matchingProduct.variants
      : [];

    return [
      {
        id: offer.id,
        name: offer.name,
        price: offer.price,
        compare_at_price: offer.compare_at_price,
        unit: offer.service_unit || matchingProduct?.unit,
        description: offer.short_description || offer.description || matchingProduct?.description,
        image_url: resolvedImg,
        category: matchingProduct?.category,
        availability_status: offer.availability_status || matchingProduct?.availability_status || "IN_STOCK",
        available_quantity: offer.available_quantity ?? matchingProduct?.available_quantity,
        inventory_tracking: offer.inventory_tracking,
        variants: resolvedVariants,
        attachments: offer.attachments || matchingProduct?.attachments,
      },
    ];
  }, [offer, products]);

  // Categories list if multi-item
  const itemCategories = useMemo(() => {
    const cats = Array.from(new Set(resolvedItems.map((i) => i.category).filter(Boolean))) as string[];
    return ["ALL", ...cats];
  }, [resolvedItems]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "ALL") return resolvedItems;
    return resolvedItems.filter((i) => i.category === activeCategory);
  }, [resolvedItems, activeCategory]);

  // Total calculation for selected items (Supports direct items and variant SKUs)
  const selectedItemsList = useMemo(() => {
    const list: Array<{
      id: string;
      item_id: string;
      variant_id?: string;
      variant_name?: string;
      name: string;
      price: number;
      quantity: number;
      line_total: number;
      unit?: string;
      image_url?: string;
    }> = [];

    resolvedItems.forEach((it) => {
      if (it.variants && it.variants.length > 0) {
        it.variants.forEach((v) => {
          const key = `${it.id}__${v.id}`;
          const qty = selectedQuantities[key] || 0;
          if (qty > 0) {
            list.push({
              id: key,
              item_id: it.id,
              variant_id: v.id,
              variant_name: v.name,
              name: `${it.name} (${v.name})`,
              price: v.price,
              quantity: qty,
              line_total: v.price * qty,
              unit: it.unit,
              image_url: it.image_url,
            });
          }
        });
      } else {
        const qty = selectedQuantities[it.id] || 0;
        if (qty > 0) {
          list.push({
            id: it.id,
            item_id: it.id,
            name: it.name,
            price: it.price,
            quantity: qty,
            line_total: it.price * qty,
            unit: it.unit,
            image_url: it.image_url,
          });
        }
      }
    });

    return list;
  }, [resolvedItems, selectedQuantities]);

  const selectedProductTypesCount = selectedItemsList.length;
  const totalItemsQuantity = selectedItemsList.reduce((acc, it) => acc + it.quantity, 0);
  const subtotalAmount = selectedItemsList.reduce((acc, it) => acc + it.line_total, 0);

  const handleUpdateQty = (key: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: next };
    });
  };

  const handleSetQtyDirect = (key: string, val: number) => {
    setSelectedQuantities((prev) => {
      const next = Math.max(0, val);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: next };
    });
  };

  // GPS Handler
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
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Shipping calculation with Offer Fulfillment Override
  const shippingCalculation = useMemo(() => {
    if (!currentStore || selectedFulfillment === "STORE_PICKUP") {
      return {
        final_shipping_fee: 0,
        is_free_shipping: true,
        selected_option: { name: "Nhận tại cửa hàng", is_quote_later: false },
      };
    }

    const itemsForShipping = selectedItemsList.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      offer_type: "PRODUCT" as const,
    }));

    return ShippingCalculationService.calculate({
      store: currentStore,
      items: itemsForShipping,
      subtotal: subtotalAmount,
      delivery_address: { address_line: deliveryLocation },
      selected_method_id: selectedShippingMethodId,
      shipping_methods: shippingMethods,
      shipping_zones: shippingZones,
      offer_fulfillment_override: offer?.fulfillment_override,
    });
  }, [currentStore, selectedFulfillment, selectedItemsList, subtotalAmount, deliveryLocation, selectedShippingMethodId, shippingMethods, shippingZones, offer]);

  const isQuoteLater = shippingCalculation.selected_option?.is_quote_later === true;
  const shippingFee = isQuoteLater || selectedFulfillment === "STORE_PICKUP" ? 0 : shippingCalculation.final_shipping_fee;
  const grandTotal = totalItemsQuantity === 0 ? 0 : subtotalAmount + shippingFee;

  // Real Enabled Payment Methods
  const enabledPaymentMethods = useMemo(() => {
    if (offer?.payment_override?.mode === "OFFER_OVERRIDE" && offer.payment_override.enabled_methods) {
      return offer.payment_override.enabled_methods;
    }
    if (currentStore.advanced_payment_settings?.enabled_methods) {
      return currentStore.advanced_payment_settings.enabled_methods;
    }
    const legacy: PaymentMethodType[] = [];
    if (currentStore.payment_settings?.enable_bank_transfer !== false) legacy.push("VIETQR");
    if (currentStore.payment_settings?.enable_cod) legacy.push("COD");
    return legacy.length > 0 ? legacy : ["VIETQR", "COD"];
  }, [offer, currentStore]);

  // Real Enabled Fulfillment Methods
  const enabledFulfillmentMethods = useMemo(() => {
    if (offer?.fulfillment_override?.mode === "OFFER_OVERRIDE" && offer.fulfillment_override.enabled_methods) {
      return offer.fulfillment_override.enabled_methods;
    }
    return currentStore.fulfillment_settings?.enabled_methods || ["DELIVERY", "STORE_PICKUP"];
  }, [offer, currentStore]);

  // Submit Final Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItemsQuantity === 0 || !offer || !currentStore) return;

    const phoneErr = getPhoneValidationError(customerPhone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setPhoneError(null);

    setIsSubmittingOrder(true);

    const orderItems = selectedItemsList.map((it) => {
      const parentItem = resolvedItems.find((r) => r.id === it.item_id);
      const matchedVariant = parentItem?.variants?.find((v) => v.id === it.variant_id);

      return {
        offer: {
          ...offer,
          name: it.name,
          price: it.price,
          cost_price: it.price * 0.5,
        },
        variant: matchedVariant || (it.variant_id ? {
          id: it.variant_id,
          name: it.variant_name || "",
          price: it.price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as OfferVariant : undefined),
        quantity: it.quantity,
      };
    });

    const orderPayload = {
      customer_name: customerName.trim() || "Khách Hàng",
      customer_phone: customerPhone.trim(),
      shipping_address: {
        full_address: selectedFulfillment === "STORE_PICKUP" ? `Nhận tại cửa hàng: ${currentStore.address || currentStore.store_name}` : deliveryLocation.trim() || "Địa chỉ giao hàng",
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng,
        map_url: gpsCoords?.map_url,
      },
      shipping_method_id: selectedShippingMethodId,
      fulfillment_method_type: selectedFulfillment,
      payment_method: paymentMethod,
      customer_notes: orderNotes.trim() ? `${orderNotes.trim()}${gpsCoords ? `\n[Tọa độ GPS: ${gpsCoords.map_url}]` : ""}` : gpsCoords ? `[Tọa độ GPS: ${gpsCoords.map_url}]` : undefined,
      items: orderItems,
    };

    try {
      const createdOrder = await createOrder(orderPayload);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setShowCheckoutModal(false);

      if (createdOrder && createdOrder.order_number) {
        router.push(`/${storeSlug}/order/${createdOrder.order_number}`);
      } else {
        router.push(`/${storeSlug}`);
      }
    } catch (err) {
      console.error("Order submission failed:", err);
      alert("Đặt hàng thất bại. Vui lòng thử lại!");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const offerUrl = typeof window !== "undefined" ? window.location.href : `/${storeSlug}/o/${offerSlug}`;
  const brandColor = currentStore.customization?.brand_color || "#10b981";

  // 1. Loading State
  if (isLoadingServer && !offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Đang tải thông tin ưu đãi...</p>
          <p className="text-xs text-neutral-400">Kết nối máy chủ và nạp danh mục sản phẩm</p>
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-32 text-neutral-900 dark:text-neutral-100">
      {/* Top Breadcrumb Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStore.store_name || "Trang chủ cửa hàng"}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              title="QR Offer"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <CopyButton text={offerUrl} label="Chia sẻ" className="text-xs" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* 1. COMPACT OFFER HEADER (Themed background & Permanent CTA) */}
        <OfferHeader
          offer={offer}
          store={currentStore}
          organization={organization}
          personalActor={personalActor}
          user={currentUser}
          sellerType={publicOffer?.seller_mini_card.actor_type}
          sellerDisplayName={publicOffer?.seller_mini_card.seller_display_name}
          sellerAvatarUrl={publicOffer?.seller_mini_card.logo_url}
          isVerified={publicOffer?.seller_mini_card.is_verified}
          publicLocation={publicOffer?.seller_mini_card.location_summary}
          itemCount={resolvedItems.length}
          customization={currentStore.customization}
        />

        {/* 2. CORE TRANSACTION SECTION: OFFER ITEMS (LEFT) + STICKY ORDER PANEL (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: PRODUCTS / SERVICES IN OFFER */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Package className="w-5 h-5" style={{ color: brandColor }} />
                <span>Sản Phẩm & Dịch Vụ Trong Offer</span>
                <span className="text-xs font-semibold text-neutral-400">({resolvedItems.length})</span>
              </h2>

              {/* Category Filter Pills (if multiple) */}
              {itemCategories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {itemCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                          : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                      }`}
                    >
                      {cat === "ALL" ? "Tất cả" : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items Grid */}
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isOutOfStock = item.availability_status === "OUT_OF_STOCK";
                const isLowStock = item.availability_status === "LOW_STOCK";
                const hasVariants = Boolean(item.variants && item.variants.length > 0);

                // Single item quantity (when no variants)
                const singleQty = selectedQuantities[item.id] || 0;

                // Total quantity chosen across all variants of this item
                const totalItemVariantsQty = hasVariants
                  ? (item.variants || []).reduce((acc, v) => acc + (selectedQuantities[`${item.id}__${v.id}`] || 0), 0)
                  : singleQty;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border transition-all flex flex-row items-start sm:items-stretch gap-3 sm:gap-4 ${
                      totalItemVariantsQty > 0
                        ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300"
                    }`}
                  >
                    {/* Item Image with Neutral Fallback (Aspect 1:1, Compact & Consistent) */}
                    <div className="w-20 h-20 sm:w-32 sm:h-32 aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700 relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-1 text-center">
                          <Package className="w-7 h-7 sm:w-10 sm:h-10 mb-0.5 opacity-40" />
                          <span className="text-[9px] sm:text-[10px] font-medium opacity-60">Chưa có ảnh</span>
                        </div>
                      )}

                      {/* Out of stock badge on image */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-1 text-center">
                          <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-black bg-rose-600 text-white shadow-xs">
                            HẾT HÀNG
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Item Info & Purchasing Stepper */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="text-xs sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 shrink-0">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Availability Tag */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {isOutOfStock ? (
                            <span className="text-xs font-bold text-rose-600">● Tạm hết hàng</span>
                          ) : isLowStock ? (
                            <span className="text-xs font-bold text-amber-600">● Sắp hết hàng ({item.available_quantity} còn lại)</span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">● Còn hàng sẵn giao ngay</span>
                          )}
                        </div>

                        {/* Attachments if any */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.attachments.map((a) => (
                              <a
                                key={a.id}
                                href={a.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{a.name} ↗</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ------------------------------------------------------------- */}
                      {/* CASE A: ITEM HAS MULTIPLE VARIANTS (PHIÊN BẢN SẢN PHẨM)      */}
                      {/* ------------------------------------------------------------- */}
                      {hasVariants ? (
                        <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>Chọn Phiên Bản / Phân Loại ({item.variants?.length}):</span>
                            </span>
                            <span className="text-xs font-bold text-neutral-400">
                              Từ {formatVND(Math.min(...(item.variants?.map((v) => v.price) || [item.price])))}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {item.variants?.map((variant) => {
                              const variantKey = `${item.id}__${variant.id}`;
                              const vQty = selectedQuantities[variantKey] || 0;

                              return (
                                <div
                                  key={variant.id}
                                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex flex-row items-center justify-between gap-2 sm:gap-3 ${
                                    vQty > 0
                                      ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/80 shadow-2xs"
                                      : "bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80"
                                  }`}
                                >
                                  <div className="min-w-0 space-y-0.5">
                                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                      {variant.name}
                                    </p>
                                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                                        {formatVND(variant.price)}
                                        {item.unit && <span className="text-[10px] font-normal text-neutral-400"> /{item.unit}</span>}
                                      </span>
                                      {variant.compare_at_price && variant.compare_at_price > variant.price && (
                                        <span className="text-[10px] sm:text-[11px] text-neutral-400 line-through">
                                          {formatVND(variant.compare_at_price)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Variant Quantity Stepper */}
                                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 shadow-2xs">
                                      <button
                                        type="button"
                                        disabled={vQty === 0 || isOutOfStock}
                                        onClick={() => handleUpdateQty(variantKey, -1)}
                                        className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        disabled={isOutOfStock}
                                        value={vQty}
                                        onChange={(e) => handleSetQtyDirect(variantKey, parseInt(e.target.value) || 0)}
                                        className="w-8 sm:w-9 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-neutral-900 dark:text-neutral-100"
                                      />
                                      <button
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => handleUpdateQty(variantKey, 1)}
                                        className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 disabled:opacity-30 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {vQty === 0 && !isOutOfStock && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQty(variantKey, 1)}
                                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                                        style={{ backgroundColor: brandColor }}
                                      >
                                        Chọn Mua
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* ------------------------------------------------------------- */
                        /* CASE B: SINGLE STANDARD ITEM (NO VARIANTS)                    */
                        /* ------------------------------------------------------------- */
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 gap-2">
                          <div className="flex items-baseline gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-lg font-black text-rose-600 dark:text-rose-400">
                              {formatVND(item.price)}
                              {item.unit && <span className="text-[10px] sm:text-xs font-normal text-neutral-400"> /{item.unit}</span>}
                            </span>
                            {item.compare_at_price && item.compare_at_price > item.price && (
                              <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                                {formatVND(item.compare_at_price)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 shadow-2xs">
                              <button
                                type="button"
                                disabled={singleQty === 0 || isOutOfStock}
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 disabled:opacity-30 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                disabled={isOutOfStock}
                                value={singleQty}
                                onChange={(e) => handleSetQtyDirect(item.id, parseInt(e.target.value) || 0)}
                                className="w-8 sm:w-10 text-center text-xs font-black bg-transparent border-0 focus:ring-0 p-0 text-neutral-900 dark:text-neutral-100"
                              />
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="p-1.5 sm:p-2 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {singleQty === 0 && !isOutOfStock && (
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                                style={{ backgroundColor: brandColor }}
                              >
                                Chọn Mua
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: DESKTOP STICKY ORDER SUMMARY PANEL */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: brandColor }} />
                  <span>Tóm Tắt Đơn Hàng</span>
                </h3>
                <span
                  style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                >
                  {selectedProductTypesCount} loại • {totalItemsQuantity} sản phẩm đã chọn
                </span>
              </div>

              {/* Selected Items List */}
              {selectedItemsList.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedItemsList.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{it.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          {formatVND(it.price)} × {it.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                        {formatVND(it.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-neutral-400 space-y-1">
                  <Package className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-semibold">Chưa chọn sản phẩm</p>
                  <p className="text-[11px] opacity-70">Chọn số lượng sản phẩm ở bên trái để tiếp tục đặt hàng.</p>
                </div>
              )}

              {/* Financial Calculation */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Tiền hàng:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatVND(subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {isQuoteLater
                      ? "Báo sau"
                      : selectedFulfillment === "STORE_PICKUP"
                      ? "Miễn phí (Tại quầy)"
                      : shippingFee === 0
                      ? "Miễn phí (0 đ)"
                      : formatVND(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-100 dark:border-neutral-800 font-black">
                  <span>Tổng thanh toán:</span>
                  <span className="text-rose-600 dark:text-rose-400 text-base">{formatVND(grandTotal)}</span>
                </div>
              </div>

              {/* CTA ĐẶT HÀNG */}
              <button
                type="button"
                disabled={totalItemsQuantity === 0}
                onClick={() => setShowCheckoutModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-98"
                style={{ backgroundColor: brandColor }}
              >
                <span>TIẾP TỤC ĐẶT HÀNG</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. SUPPORTING INFORMATION (DELIVERY & PAYMENT RULES) */}
        <OfferPolicySummary
          paymentSettings={currentStore.advanced_payment_settings}
          fulfillmentSettings={currentStore.fulfillment_settings}
          policies={currentStore.policy_settings}
          onOpenPolicyModal={(tab: "shipping" | "returns" | "warranty" | "payment") => {
            setPolicyInitialTab(tab);
            setShowPoliciesModal(true);
          }}
        />

        {/* 4. SELLER TRUST SUMMARY (BELOW TRANSACTION) */}
        <SellerTrustSummary
          sellerDisplayName={publicOffer?.seller_mini_card.seller_display_name || currentStore.store_name}
          sellerSlug={publicOffer?.seller_mini_card.seller_slug || storeSlug}
          trustScore={publicOffer?.trust_summary.trust_score}
          completionRate={publicOffer?.trust_summary.completion_rate}
          onTimeRate={publicOffer?.trust_summary.on_time_delivery_rate}
          completedTransactions={publicOffer?.trust_summary.completed_transactions}
          isVerified={publicOffer?.trust_summary.is_verified_business}
          memberSince={publicOffer?.trust_summary.member_since}
        />

        {/* 5. OTHER ACTIVE OFFERS FROM STORE */}
        {publicOffer?.other_active_offers && publicOffer.other_active_offers.length > 0 && (
          <OtherActiveOffers offers={publicOffer.other_active_offers} storeName={currentStore.store_name} />
        )}
      </main>

      {/* 6. MOBILE STICKY ORDER BAR */}
      {totalItemsQuantity > 0 && (
        <div className="lg:hidden fixed bottom-4 inset-x-3 z-40 animate-in slide-in-from-bottom-4">
          <div className="p-3.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-900 rounded-3xl shadow-2xl flex items-center justify-between gap-3 border border-neutral-800 dark:border-neutral-200">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div
                className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs"
                style={{ backgroundColor: brandColor }}
              >
                {totalItemsQuantity}
              </div>
              <div className="truncate">
                <p className="text-[10px] opacity-70">
                  {selectedProductTypesCount} loại ({totalItemsQuantity} sản phẩm)
                </p>
                <p className="text-sm font-black text-rose-400 dark:text-rose-600 truncate">{formatVND(grandTotal)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCheckoutModal(true)}
              className="px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all"
              style={{ backgroundColor: brandColor }}
            >
              <span>ĐẶT HÀNG</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 7. CHECKOUT & DELIVERY MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">Xác Nhận Đặt Hàng</h3>
                  <p className="text-xs text-neutral-500">
                    {selectedProductTypesCount} loại sản phẩm • {totalItemsQuantity} sản phẩm • Tổng {formatVND(grandTotal)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handlePlaceOrder} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* 1. Buyer Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">1. Thông Tin Người Nhận</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setPhoneError(null);
                      }}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                    {phoneError && <p className="text-[11px] text-rose-500 mt-1">{phoneError}</p>}
                  </div>
                </div>
              </div>

              {/* 2. Fulfillment Method */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">2. Phương Thức Nhận Hàng</h4>
                <div className="grid grid-cols-2 gap-3">
                  {enabledFulfillmentMethods.includes("DELIVERY") && (
                    <button
                      type="button"
                      onClick={() => setSelectedFulfillment("DELIVERY")}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedFulfillment === "DELIVERY"
                          ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30"
                          : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Giao Hàng Tận Nơi</p>
                        <p className="text-[10px] text-neutral-500">Chuyển phát tiêu chuẩn</p>
                      </div>
                    </button>
                  )}

                  {enabledFulfillmentMethods.includes("STORE_PICKUP") && (
                    <button
                      type="button"
                      onClick={() => setSelectedFulfillment("STORE_PICKUP")}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedFulfillment === "STORE_PICKUP"
                          ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30"
                          : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <StoreIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Nhận Tại Cửa Hàng</p>
                        <p className="text-[10px] text-emerald-600 font-bold">Miễn phí ship</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Delivery Address or Store Pickup Notice */}
                {selectedFulfillment === "DELIVERY" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Địa chỉ nhận hàng *
                      </label>
                      <button
                        type="button"
                        onClick={handleGetGPSLocation}
                        disabled={isLocatingGPS}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>{isLocatingGPS ? "Đang định vị..." : "Lấy vị trí GPS"}</span>
                      </button>
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                    <p className="font-bold text-emerald-800 dark:text-emerald-200">Địa chỉ nhận hàng tại cửa hàng:</p>
                    <p className="text-emerald-700 dark:text-emerald-300">{currentStore.address || "Liên hệ cửa hàng để nhận địa chỉ chính xác"}</p>
                  </div>
                )}
              </div>

              {/* 3. Payment Method */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">3. Phương Thức Thanh Toán</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {enabledPaymentMethods.includes("VIETQR") && (
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "VIETQR"}
                        onChange={() => setPaymentMethod("VIETQR")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Chuyển khoản VietQR</p>
                        <p className="text-[10px] text-neutral-500">Quét mã QR Napas247 tự động</p>
                      </div>
                    </label>
                  )}

                  {enabledPaymentMethods.includes("COD") && (
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Thanh toán khi nhận (COD)</p>
                        <p className="text-[10px] text-neutral-500">Tiền mặt khi giao hàng</p>
                      </div>
                    </label>
                  )}

                  {enabledPaymentMethods.includes("PAY_AT_STORE") && selectedFulfillment === "STORE_PICKUP" && (
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "PAY_AT_STORE"}
                        onChange={() => setPaymentMethod("PAY_AT_STORE")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Thanh toán tại quầy</p>
                        <p className="text-[10px] text-neutral-500">Tiền mặt hoặc quẹt thẻ</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* 4. Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Ghi chú đơn hàng (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ghi chú thời gian giao hàng, lời dặn người bán..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium"
                />
              </div>

              {/* Order Total Review */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tiền hàng:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatVND(subtotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phí giao hàng:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedFulfillment === "STORE_PICKUP"
                      ? "Miễn phí"
                      : isQuoteLater
                      ? "Báo sau"
                      : shippingFee === 0
                      ? "Miễn phí (0 đ)"
                      : formatVND(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Tổng thanh toán:</span>
                  <span className="text-rose-600 dark:text-rose-400 text-base">{formatVND(grandTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 transition-all"
                  style={{ backgroundColor: brandColor }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Xử Lý Đơn Hàng...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>XÁC NHẬN ĐẶT HÀNG</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={offerUrl}
        title={offer.name}
        subtitle="Quét mã QR để mở trang ưu đãi trên điện thoại"
      />

      {/* Policies Modal */}
      <StorePoliciesModal
        isOpen={showPoliciesModal}
        onClose={() => setShowPoliciesModal(false)}
        storeName={currentStore.store_name || "Cửa hàng"}
        policies={currentStore.policy_settings || {}}
        initialTab={policyInitialTab}
      />
    </div>
  );
}

export default function DirectOfferPage() {
  const params = useParams();
  const storeSlug = (params?.store_slug as string) || "auto";

  return (
    <CartProvider>
      <DirectOfferContent />
      <CartDrawer storeSlug={storeSlug} />
    </CartProvider>
  );
}
