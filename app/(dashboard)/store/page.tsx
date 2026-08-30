"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store as StoreIcon,
  QrCode,
  ExternalLink,
  Save,
  CreditCard,
  Building,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Truck,
  PackageCheck,
  AlertCircle,
  Boxes,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { CopyButton } from "@/components/shared/copy-button";
import { QRModal } from "@/components/shared/qr-modal";
import { AppUrlService } from "@/lib/services/url";
import { formatVND } from "@/lib/utils";

export default function StoreSettingsPage() {
  const { store, updateStore, shippingMethods, updateShippingMethod } = useCommerceStore();
  const [storeName, setStoreName] = useState(store.store_name);
  const [slug, setSlug] = useState(store.slug);
  const [description, setDescription] = useState(store.description || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [email, setEmail] = useState(store.email || "");
  const [address, setAddress] = useState(store.address || "");
  const [bankBin, setBankBin] = useState(store.payment_settings?.bank_bin || "970422");
  const [bankName, setBankName] = useState(store.payment_settings?.bank_name || "MBBank");
  const [bankAccountNo, setBankAccountNo] = useState(store.payment_settings?.bank_account_no || "");
  const [bankAccountName, setBankAccountName] = useState(store.payment_settings?.bank_account_name || "");
  const [enableCod, setEnableCod] = useState(store.payment_settings?.enable_cod ?? true);
  
  // Shipping settings state
  const [shippingEnabled, setShippingEnabled] = useState(store.shipping_settings?.shipping_enabled ?? true);
  const [defaultFixedFee, setDefaultFixedFee] = useState(store.shipping_settings?.default_fixed_fee ?? 30000);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(store.shipping_settings?.free_shipping_threshold ?? 500000);
  const [enableStorePickup, setEnableStorePickup] = useState(store.shipping_settings?.enable_store_pickup ?? true);
  const [enableQuoteLater, setEnableQuoteLater] = useState(store.shipping_settings?.enable_quote_later ?? true);
  const [pickupAddress, setPickupAddress] = useState(store.shipping_settings?.pickup_address || store.address || "");

  // Product Visibility Settings State
  const [showOutOfStockProducts, setShowOutOfStockProducts] = useState(
    store.product_visibility_settings?.show_out_of_stock_products ?? true
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    store.product_visibility_settings?.low_stock_threshold ?? 5
  );
  const [showLowStockBadge, setShowLowStockBadge] = useState(
    store.product_visibility_settings?.show_low_stock_badge ?? true
  );
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const storeUrl = AppUrlService.getStoreUrl(slug);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStore({
      store_name: storeName,
      slug: slug,
      description,
      phone,
      email,
      address,
      payment_settings: {
        bank_bin: bankBin,
        bank_name: bankName,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName,
        enable_cod: enableCod,
        enable_bank_transfer: true,
      },
      shipping_settings: {
        shipping_enabled: shippingEnabled,
        default_fixed_fee: Number(defaultFixedFee),
        free_shipping_threshold: Number(freeShippingThreshold),
        enable_store_pickup: enableStorePickup,
        enable_quote_later: enableQuoteLater,
        pickup_address: pickupAddress,
      },
      product_visibility_settings: {
        show_out_of_stock_products: showOutOfStockProducts,
        low_stock_threshold: Number(lowStockThreshold),
        show_low_stock_badge: showLowStockBadge,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Cửa Hàng & Kênh Bán Hàng (Storefront)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cấu hình địa chỉ URL công khai, thông tin nhận diện thương hiệu và tài khoản VietQR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Mã QR</span>
          </button>
          <CopyButton text={storeUrl} label="Copy Link Store" className="py-2 text-xs" />
          <Link
            href={`/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở Store</span>
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
          ✓ Đã lưu cấu hình Cửa hàng & VietQR thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-blue-600" />
            <span>Thông tin Storefront</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Tên Cửa hàng / Thương hiệu *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Đường dẫn tĩnh (Slug URL) *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-xl text-neutral-500">
                  /
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-r-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Giới thiệu ngắn gọn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {/* Dynamic VietQR & Payment Account */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Tài Khoản Nhận Tiền & Cấu Hình VietQR</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Mã BIN Ngân Hàng (NAPAS) *
              </label>
              <select
                value={bankBin}
                onChange={(e) => {
                  setBankBin(e.target.value);
                  if (e.target.value === "970422") setBankName("MBBank (Ngân Hàng Quân Đội)");
                  if (e.target.value === "970436") setBankName("Vietcombank");
                  if (e.target.value === "970415") setBankName("VietinBank");
                  if (e.target.value === "970407") setBankName("Techcombank");
                  if (e.target.value === "970418") setBankName("BIDV");
                  if (e.target.value === "970432") setBankName("VPBank");
                  if (e.target.value === "970423") setBankName("TPBank");
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              >
                <option value="970422">970422 - MBBank (Ngân Hàng Quân Đội)</option>
                <option value="970436">970436 - Vietcombank</option>
                <option value="970415">970415 - VietinBank</option>
                <option value="970407">970407 - Techcombank</option>
                <option value="970418">970418 - BIDV</option>
                <option value="970432">970432 - VPBank</option>
                <option value="970423">970423 - TPBank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Số tài khoản ngân hàng *
              </label>
              <input
                type="text"
                required
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Tên chủ tài khoản (In hoa không dấu) *
              </label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="enableCod"
              checked={enableCod}
              onChange={(e) => setEnableCod(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="enableCod" className="text-xs text-neutral-700 dark:text-neutral-300">
              Bật phương thức thanh toán COD (Thanh toán khi nhận hàng / Thu tiền tận nơi)
            </label>
          </div>
        </div>

        {/* Shipping & Fulfillment Configuration */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Thiết Lập Vận Chuyển & Giao Hàng (Shipping Settings)</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shippingEnabled"
                checked={shippingEnabled}
                onChange={(e) => setShippingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="shippingEnabled" className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Cho phép giao hàng
              </label>
            </div>
          </div>

          {shippingEnabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phí vận chuyển tiêu chuẩn mặc định (đ) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={defaultFixedFee}
                    onChange={(e) => setDefaultFixedFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Áp dụng cho các đơn hàng giao toàn quốc thông thường.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ngưỡng Miễn phí vận chuyển (Freeship từ đ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Đơn hàng đạt giá trị tạm tính $\ge$ mức này sẽ tự động được miễn phí ship 0đ.
                  </p>
                </div>
              </div>

              {/* Store Pickup */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableStorePickup"
                    checked={enableStorePickup}
                    onChange={(e) => setEnableStorePickup(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enableStorePickup" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cho phép khách nhận trực tiếp tại Cửa hàng / Xưởng (Phí 0đ)</span>
                  </label>
                </div>

                {enableStorePickup && (
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Địa chỉ nhận hàng trực tiếp
                    </label>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Nhập địa chỉ xưởng hoặc cửa hàng..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                )}
              </div>

              {/* Quote Later for B2B */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableQuoteLater"
                    checked={enableQuoteLater}
                    onChange={(e) => setEnableQuoteLater(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="enableQuoteLater" className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Hỗ trợ phương thức "Báo phí vận chuyển sau" (Dành cho máy móc / hàng cồng kềnh / xe tải)
                  </label>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 pl-5">
                  Khách đặt hàng gửi yêu cầu $\rightarrow$ Bạn nhập phí vận chuyển trong quản lý đơn $\rightarrow$ Khách duyệt tổng tiền mới sinh mã thanh toán.
                </p>
              </div>

              {/* Active Shipping Methods List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Các phương thức vận chuyển khả dụng:
                </h4>
                <div className="space-y-2">
                  {shippingMethods.map((sm) => (
                    <div
                      key={sm.id}
                      className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">{sm.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                            {sm.method_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 truncate">{sm.description || "Giao hàng tận nơi"}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {sm.method_type === "PICKUP" || sm.method_type === "FREE"
                            ? "0đ"
                            : sm.method_type === "QUOTE_LATER"
                            ? "Báo sau"
                            : `${formatVND(sm.fixed_fee || defaultFixedFee)}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateShippingMethod(sm.id, { active: !sm.active })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            sm.active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-400"
                          }`}
                        >
                          {sm.active ? "Đang bật" : "Đã tắt"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Đang tắt tính năng vận chuyển. Tất cả đơn hàng sẽ được áp dụng phí giao hàng 0đ (Thích hợp cho cửa hàng chuyên Dịch vụ/Sản phẩm số).</span>
            </div>
          )}
        </div>

        {/* Product Visibility & Inventory Rules Configuration */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-purple-600" />
              <span>Thiết Lập Hiển Thị Sản Phẩm & Quy Tắc Tồn Kho (Product Visibility)</span>
            </h3>
          </div>

          <div className="space-y-4">
            {/* Out of stock visibility options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Khi sản phẩm hết hàng trong kho:
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name="outOfStockVisibility"
                    checked={showOutOfStockProducts === true}
                    onChange={() => setShowOutOfStockProducts(true)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Vẫn hiển thị trên Storefront và gắn nhãn "Tạm hết hàng" (Khuyên dùng)
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Giúp khách hàng nắm được danh mục sản phẩm của xưởng/shop, nút mua sẽ bị vô hiệu hóa và tự động xếp xuống cuối danh sách.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name="outOfStockVisibility"
                    checked={showOutOfStockProducts === false}
                    onChange={() => setShowOutOfStockProducts(false)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Ẩn hoàn toàn khỏi cửa hàng công khai
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Sản phẩm hết hàng sẽ biến mất khỏi Storefront và Offer, chỉ xuất hiện lại sau khi bạn nhập thêm tồn kho.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Low stock threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ngưỡng cảnh báo sắp hết hàng (Low Stock Threshold)
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Khi tồn kho khả dụng $\le$ mức này, hệ thống sẽ gắn nhãn "Sắp hết hàng".
                </p>
              </div>

              <div className="flex flex-col justify-center pt-2 sm:pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLowStockBadge}
                    onChange={(e) => setShowLowStockBadge(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Hiển thị nhãn "Sắp hết (Còn X cái)" cho khách hàng</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thiết Lập Cửa Hàng</span>
          </button>
        </div>
      </form>

      {/* QR MODAL */}
      {showQR && (
        <QRModal
          isOpen={true}
          onClose={() => setShowQR(false)}
          url={storeUrl}
          title="Mã QR Cửa Hàng"
          subtitle={storeName}
        />
      )}
    </div>
  );
}
