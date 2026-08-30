"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  Phone,
  User,
  MapPin,
  FileText,
  Navigation,
  Loader2,
  Check,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND } from "@/lib/utils";
import { CartProvider, useCart } from "@/components/storefront/cart-drawer";
import { ShippingCalculationService } from "@/lib/shipping/engine";
import { ProductAvailabilityService } from "@/lib/inventory/availability";

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.store_slug as string) || "2k-store";
  const { store, createOrder, shippingMethods, shippingZones } = useCommerceStore();
  const { cart, subtotal, clearCart, removeFromCart } = useCart();

  // Availability Revalidation
  const unpurchasableItems = cart.filter(
    (it) => !ProductAvailabilityService.isPurchasable(it.offer, it.quantity).purchasable
  );
  const hasInvalidStock = unpurchasableItems.length > 0;

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "COD">("BANK_TRANSFER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; map_url: string } | null>(null);

  // Dynamic Shipping Calculation via Engine
  const shippingCalculation = ShippingCalculationService.calculate({
    store,
    items: cart.map((it) => ({
      id: it.offer.id,
      name: it.offer.name,
      price: it.variant ? it.variant.price : it.offer.price,
      quantity: it.quantity,
      offer_type: it.offer.offer_type,
    })),
    subtotal,
    delivery_address: { address_line: shippingAddress },
    selected_method_id: selectedShippingMethodId,
    shipping_methods: shippingMethods,
    shipping_zones: shippingZones,
  });

  const selectedShippingOption = shippingCalculation.selected_option;
  const isQuoteLater = selectedShippingOption?.is_quote_later === true;
  const shippingFee = isQuoteLater ? 0 : shippingCalculation.final_shipping_fee;
  const grandTotal = subtotal + shippingFee;
  const hasPhysical = cart.some((i) => i.offer.offer_type === "PRODUCT");

  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Thiết bị hoặc trình duyệt không hỗ trợ GPS.");
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
        if (!shippingAddress.trim()) {
          setShippingAddress(`📍 Vị trí GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        alert("Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);

    const newOrder = createOrder({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      shipping_address: shippingAddress.trim()
        ? {
            full_address: shippingAddress.trim(),
            latitude: gpsCoords?.lat,
            longitude: gpsCoords?.lng,
            map_url: gpsCoords?.map_url,
          }
        : undefined,
      items: cart,
      payment_method: paymentMethod,
      shipping_method_id: selectedShippingOption?.method_id,
      customer_notes: `${customerNotes.trim() ? `${customerNotes.trim()} ` : ""}${gpsCoords ? `[GPS: ${gpsCoords.lat.toFixed(5)},${gpsCoords.lng.toFixed(5)}]` : ""}`,
    });

    clearCart();
    router.push(`/${storeSlug}/order/${newOrder.order_number}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Giỏ hàng của bạn đang trống
          </p>
          <Link
            href={`/${storeSlug}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Quay lại Cửa Hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{store.store_name}</span>
          </Link>
          <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thanh toán an toàn (Không cần đăng nhập)</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Form */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Customer Information Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Info Card */}
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Thông tin người nhận</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0988 123 456"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Email (nhận hóa đơn)
                    </label>
                    <input
                      type="email"
                      placeholder="email@domain.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                {hasPhysical && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Địa chỉ nhận hàng *
                      </label>

                      <button
                        type="button"
                        onClick={handleGetGPSLocation}
                        disabled={isLocatingGPS}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
                      >
                        {isLocatingGPS ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Đang lấy GPS...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            <span>📍 Lấy định vị GPS</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      required={hasPhysical}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />

                    {gpsCoords && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã gắn tọa độ: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</span>
                        </span>
                        <a
                          href={gpsCoords.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline text-emerald-700 hover:text-emerald-900"
                        >
                          Xem Maps ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ghi chú đơn hàng (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Method Card (Step 2) */}
            {shippingCalculation.requires_shipping && (
              <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>2. Phương thức giao hàng & Vận chuyển</span>
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {shippingCalculation.available_options.length} lựa chọn
                  </span>
                </div>

                <div className="space-y-3">
                  {shippingCalculation.available_options.map((option) => {
                    const isSelected = (selectedShippingOption?.method_id === option.method_id) || (!selectedShippingMethodId && option === shippingCalculation.selected_option);
                    return (
                      <label
                        key={option.method_id}
                        onClick={() => setSelectedShippingMethodId(option.method_id)}
                        className={`p-4 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                              <span>{option.name}</span>
                              {option.estimated_delivery && (
                                <span className="text-[10px] font-normal text-neutral-500">
                                  ({option.estimated_delivery})
                                </span>
                              )}
                            </p>
                            {option.description && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {option.is_quote_later ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Báo phí sau
                            </span>
                          ) : option.fee === 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                MIỄN PHÍ
                              </span>
                              {option.original_fee > 0 && (
                                <span className="text-[10px] text-neutral-400 line-through">
                                  {formatVND(option.original_fee)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-black text-neutral-900 dark:text-neutral-100">
                              {formatVND(option.fee)}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Method Card (Step 3) */}
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{shippingCalculation.requires_shipping ? "3" : "2"}. Phương thức thanh toán</span>
              </h3>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                      : "border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                      {paymentMethod === "BANK_TRANSFER" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Thanh toán ngay qua chuyển khoản/QR (Khuyên dùng)
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Quét mã QR tự động điền số tiền & nội dung, xác nhận tức thì
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Tức thì
                  </span>
                </label>

                {store.payment_settings?.enable_cod && (
                  <label
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                        {paymentMethod === "COD" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          Thanh toán khi nhận hàng (COD)
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Kiểm tra hàng và trả tiền mặt cho bưu tá
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                Đơn hàng của bạn ({cart.length} mục)
              </h3>

              {hasInvalidStock && (
                <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-1">
                  <p className="font-bold">⚠️ Có sản phẩm không khả dụng trong giỏ hàng:</p>
                  <p className="text-[11px]">Vui lòng xóa các sản phẩm hết hàng để tiếp tục đặt hàng.</p>
                </div>
              )}

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-60 overflow-y-auto">
                {cart.map((item, idx) => {
                  const price = item.variant ? item.variant.price : item.offer.price;
                  const check = ProductAvailabilityService.isPurchasable(item.offer, item.quantity);
                  const isItemOutOfStock = !check.purchasable;

                  return (
                    <div key={idx} className={`py-2.5 flex items-center justify-between text-xs ${isItemOutOfStock ? "text-red-600 dark:text-red-400" : ""}`}>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.offer.name}</p>
                        {isItemOutOfStock && (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-600 text-white my-0.5">
                            {check.reason || "Tạm hết hàng"}
                          </span>
                        )}
                        {item.variant && (
                          <p className="text-[11px] text-neutral-500">Phân loại: {item.variant.name}</p>
                        )}
                        <p className="text-[11px] text-neutral-400">
                          {formatVND(price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {formatVND(price * item.quantity)}
                        </span>
                        {isItemOutOfStock && (
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.offer.id, item.variant?.id)}
                            className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold hover:bg-red-200"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Tạm tính (Tiền hàng):</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">{formatVND(subtotal)}</span>
                </div>

                {shippingCalculation.requires_shipping && (
                  <div className="flex justify-between text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span>Phí vận chuyển:</span>
                      {selectedShippingOption && (
                        <span className="text-[10px] text-neutral-400">({selectedShippingOption.name})</span>
                      )}
                    </span>
                    <span className="font-bold">
                      {isQuoteLater ? (
                        <span className="text-amber-600 dark:text-amber-400">Báo phí sau</span>
                      ) : shippingFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Miễn phí (0đ)</span>
                      ) : (
                        <span className="text-neutral-800 dark:text-neutral-200">{formatVND(shippingFee)}</span>
                      )}
                    </span>
                  </div>
                )}

                {isQuoteLater && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                    ℹ️ Bạn chưa cần thanh toán ngay. Cửa hàng sẽ liên hệ xác nhận phí vận chuyển chính xác trước khi gửi mã thanh toán.
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-neutral-900 dark:text-neutral-100 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Tổng thanh toán:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {isQuoteLater ? `${formatVND(subtotal)} + Phí ship` : formatVND(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || hasInvalidStock}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {isSubmitting
                    ? "Đang xử lý đơn..."
                    : hasInvalidStock
                    ? "Vui Lòng Xóa Mục Hết Hàng Trước Khi Đặt"
                    : isQuoteLater
                    ? "GỬI YÊU CẦU ĐẶT HÀNG (BÁO PHÍ SAU)"
                    : `ĐẶT HÀNG – ${formatVND(grandTotal)}`}
                </span>
              </button>

              <p className="text-[11px] text-neutral-400 text-center">
                Bằng việc nhấn đặt hàng, bạn đồng ý với điều khoản giao dịch của {store.store_name}
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
}
