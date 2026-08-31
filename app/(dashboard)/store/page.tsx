"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store as StoreIcon,
  QrCode,
  ExternalLink,
  Save,
  CreditCard,
  Building,
  Truck,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Landmark,
  ArrowRight,
  Layout,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { CopyButton } from "@/components/shared/copy-button";
import { QRModal } from "@/components/shared/qr-modal";
import { AppUrlService } from "@/lib/services/url";
import {
  PaymentMethodType,
  FulfillmentMethodType,
  StorePaymentSettings,
  StoreFulfillmentSettings,
} from "@/types";
import { PaymentSettingsService } from "@/lib/services/payment-settings-service";
import { FulfillmentService } from "@/lib/services/fulfillment-service";
import { StoreCustomizer } from "@/components/templates/store-customizer";

type ActiveTab = "INFO" | "TEMPLATES" | "PAYMENT_METHODS" | "PAYMENT_ACCOUNTS" | "FULFILLMENT" | "POLICIES";

export default function StoreSettingsPage() {
  const {
    store,
    organization,
    currentContext,
    updateStore,
    paymentAccounts,
    addPaymentAccount,
    deletePaymentAccount,
    setDefaultPaymentAccount,
    updateStorePaymentSettings,
    updateStoreFulfillmentSettings,
    templateLicenses,
    applyStoreTemplate,
    purchaseTemplateLicense,
    updateStoreCustomization,
  } = useCommerceStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("INFO");

  // Tab 1: Info State
  const [storeName, setStoreName] = useState(store.store_name || "");
  const [slug, setSlug] = useState(store.slug || "");
  const [description, setDescription] = useState(store.description || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [email, setEmail] = useState(store.email || "");
  const [address, setAddress] = useState(store.address || "");

  // Tab 2: Store Payment Methods State
  const [paymentSettings, setPaymentSettings] = useState<StorePaymentSettings>(
    store.advanced_payment_settings || PaymentSettingsService.getStorePaymentSettings(store)
  );

  // Synchronize with store updates
  useEffect(() => {
    setStoreName(store.store_name || "");
    setSlug(store.slug || "");
    setDescription(store.description || "");
    setPhone(store.phone || "");
    setEmail(store.email || "");
    setAddress(store.address || "");
    if (store.advanced_payment_settings) {
      setPaymentSettings(store.advanced_payment_settings);
    }
    if (store.advanced_fulfillment_settings) {
      setFulfillmentSettings(store.advanced_fulfillment_settings);
    }
  }, [store]);

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const autoOldSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || slug === autoOldSlug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  };

  // Tab 3: Payment Accounts State & Add Modal
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccBankBin, setNewAccBankBin] = useState("970422");
  const [newAccBankName, setNewAccBankName] = useState("Ngân Hàng TMCP Quân Đội (MBBank)");
  const [newAccShortName, setNewAccShortName] = useState("MBBank");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccIsDefault, setNewAccIsDefault] = useState(false);

  // Tab 4: Fulfillment State
  const [fulfillmentSettings, setFulfillmentSettings] = useState<StoreFulfillmentSettings>(
    store.advanced_fulfillment_settings || FulfillmentService.getStoreFulfillmentSettings(store)
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const storeUrl = AppUrlService.getStoreUrl(slug);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update Basic Store Info
    updateStore({
      store_name: storeName,
      slug: slug,
      description,
      phone,
      email,
      address,
    });

    // 2. Update Advanced Payment Settings
    updateStorePaymentSettings(paymentSettings);

    // 3. Update Advanced Fulfillment Settings
    updateStoreFulfillmentSettings(fulfillmentSettings);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccNumber || !newAccName) return;

    const acc = addPaymentAccount({
      actor_id: organization.id,
      actor_type: "ORGANIZATION",
      bank_bin: newAccBankBin,
      bank_name: newAccBankName,
      bank_short_name: newAccShortName,
      account_number: newAccNumber.trim(),
      account_name: newAccName.trim().toUpperCase(),
      qr_template: "compact",
      is_default: newAccIsDefault,
      verification_status: "VERIFIED",
    });

    if (newAccIsDefault) {
      setPaymentSettings({
        ...paymentSettings,
        default_payment_account_id: acc.id,
      });
    }

    setNewAccNumber("");
    setNewAccName("");
    setNewAccIsDefault(false);
    setShowAddAccountModal(false);
  };

  const togglePaymentMethod = (method: PaymentMethodType) => {
    const isCurrentlyEnabled = paymentSettings.enabled_methods.includes(method);
    const newEnabled = isCurrentlyEnabled
      ? paymentSettings.enabled_methods.filter((m) => m !== method)
      : [...paymentSettings.enabled_methods, method];

    setPaymentSettings({
      ...paymentSettings,
      enabled_methods: newEnabled,
    });
  };

  const toggleFulfillmentMethod = (method: FulfillmentMethodType) => {
    const isCurrentlyEnabled = fulfillmentSettings.enabled_methods.includes(method);
    const newEnabled = isCurrentlyEnabled
      ? fulfillmentSettings.enabled_methods.filter((m) => m !== method)
      : [...fulfillmentSettings.enabled_methods, method];

    setFulfillmentSettings({
      ...fulfillmentSettings,
      enabled_methods: newEnabled,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            <StoreIcon className="w-6 h-6 text-blue-600" />
            <span>Thiết Lập Cửa Hàng & Kênh Bán</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cấu hình phương thức thanh toán, tài khoản nhận tiền, vận chuyển và chính sách bán hàng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Mã QR</span>
          </button>
          <CopyButton text={storeUrl} label="Copy Link Cửa Hàng" className="py-2 text-xs" />
          <Link
            href={`/${slug}`}
            target="_blank"
            title="Xem trang cửa hàng giống như khách hàng nhìn thấy."
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Xem cửa hàng</span>
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công toàn bộ thiết lập Cửa hàng, Thanh toán & Vận chuyển!</span>
        </div>
      )}

      {/* Navigation Tabs (5 Tabs) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("INFO")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "INFO"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Thông Tin Cửa Hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TEMPLATES")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "TEMPLATES"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>2. Mẫu Giao Diện & Tùy Biến</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PAYMENT_METHODS")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "PAYMENT_METHODS"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>3. Phương Thức Thanh Toán</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PAYMENT_ACCOUNTS")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "PAYMENT_ACCOUNTS"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>4. Tài Khoản Nhận Tiền</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FULFILLMENT")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "FULFILLMENT"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>5. Vận Chuyển & Giao Hàng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("POLICIES")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "POLICIES"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>6. Chính Sách & Hiển Thị</span>
        </button>
      </div>

      {activeTab === "TEMPLATES" && (
        <StoreCustomizer
          store={store}
          currentContext={currentContext}
          licenses={templateLicenses}
          onUpdateCustomization={updateStoreCustomization}
          onApplyTemplate={applyStoreTemplate}
          onPurchaseTemplate={(tplId, price) => purchaseTemplateLicense({ templateId: tplId, price })}
        />
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: STORE BASIC INFO */}
        {activeTab === "INFO" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-blue-600" />
                  <span>Thông tin cửa hàng công khai</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Đây là những thông tin khách hàng sẽ nhìn thấy khi truy cập trang cửa hàng của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tên cửa hàng / thương hiệu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cửa Hàng Thiết Bị 2K"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Đường dẫn trang cửa hàng *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 rounded-l-xl text-neutral-500 font-mono text-[11px]">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-r-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Giới thiệu ngắn
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt về năng lực, sản phẩm kinh doanh hoặc giải pháp của doanh nghiệp..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Số điện thoại công khai
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0988 123 456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Thông tin này có thể được hiển thị cho khách hàng trên Trang cửa hàng.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email công khai
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: contact@congty2k.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Thông tin này có thể được hiển thị cho khách hàng trên Trang cửa hàng.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Địa chỉ cửa hàng
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: Tòa nhà 2K Tower, 123 Đường Công Nghệ, Q. Cầu Giấy, Hà Nội"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Thông tin này có thể được hiển thị cho khách hàng trên Trang cửa hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE PAYMENT METHODS */}
        {activeTab === "PAYMENT_METHODS" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Phương Thức Thanh Toán Cho Phép Mặc Định (Store Defaults)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Khách mua hàng sẽ được lựa chọn các phương thức này khi đặt hàng, trừ khi Offer có cấu hình tùy chỉnh riêng.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {/* 1. VietQR */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        Chuyển Khoản Ngân Hàng / VietQR Tự Động
                      </span>
                      <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Khuyên dùng</span>
                    </div>
                    <p className="text-neutral-500 text-[11px]">
                      Hệ thống tự động sinh mã VietQR theo đúng số tiền đơn hàng và tài khoản nhận tiền mặc định.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enabled_methods.includes("VIETQR")}
                    onChange={() => togglePaymentMethod("VIETQR")}
                    className="w-4 h-4 text-blue-600 rounded mt-1 cursor-pointer"
                  />
                </div>

                {/* 2. COD */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Thanh Toán Khi Nhận Hàng (COD)
                    </span>
                    <p className="text-neutral-500 text-[11px]">
                      Khách hàng thanh toán tiền mặt cho nhân viên giao hàng sau khi nhận và kiểm tra hàng.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enabled_methods.includes("COD")}
                    onChange={() => togglePaymentMethod("COD")}
                    className="w-4 h-4 text-blue-600 rounded mt-1 cursor-pointer"
                  />
                </div>

                {/* 3. Pay at Store */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Thanh Toán Tại Cửa Hàng / Showroom
                    </span>
                    <p className="text-neutral-500 text-[11px]">
                      Chỉ áp dụng khi khách hàng chọn phương thức nhận hàng tại cửa hàng.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={paymentSettings.enabled_methods.includes("PAY_AT_STORE")}
                    onChange={() => togglePaymentMethod("PAY_AT_STORE")}
                    className="w-4 h-4 text-blue-600 rounded mt-1 cursor-pointer"
                  />
                </div>

                {/* 4. Deposit */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                        Đặt Cọc Trước (Deposit)
                      </span>
                      <p className="text-neutral-500 text-[11px]">
                        Yêu cầu khách thanh toán trước một phần giá trị đơn hàng, phần còn lại thanh toán khi giao hàng.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.enabled_methods.includes("DEPOSIT")}
                      onChange={() => togglePaymentMethod("DEPOSIT")}
                      className="w-4 h-4 text-blue-600 rounded mt-1 cursor-pointer"
                    />
                  </div>

                  {paymentSettings.enabled_methods.includes("DEPOSIT") && (
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-3">
                      <span className="text-neutral-600 dark:text-neutral-400">Tỷ lệ đặt cọc mặc định:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="90"
                          value={paymentSettings.method_configs.DEPOSIT?.deposit_percentage || 30}
                          onChange={(e) =>
                            setPaymentSettings({
                              ...paymentSettings,
                              method_configs: {
                                ...paymentSettings.method_configs,
                                DEPOSIT: {
                                  ...paymentSettings.method_configs.DEPOSIT,
                                  deposit_percentage: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-center"
                        />
                        <span className="font-bold">%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Pay Later */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                        Thanh Toán Sau / Bán Chịu Công Nợ (Pay Later)
                      </span>
                      <p className="text-neutral-500 text-[11px]">
                        Cho phép khách hàng B2B / đối tác nhận hàng trước và thanh toán sau theo kỳ hạn thỏa thuận.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={paymentSettings.enabled_methods.includes("PAY_LATER")}
                      onChange={() => togglePaymentMethod("PAY_LATER")}
                      className="w-4 h-4 text-blue-600 rounded mt-1 cursor-pointer"
                    />
                  </div>

                  {paymentSettings.enabled_methods.includes("PAY_LATER") && (
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-3">
                      <span className="text-neutral-600 dark:text-neutral-400">Kỳ hạn công nợ mặc định:</span>
                      <select
                        value={paymentSettings.method_configs.PAY_LATER?.pay_later_terms || "NET_30"}
                        onChange={(e) =>
                          setPaymentSettings({
                            ...paymentSettings,
                            method_configs: {
                              ...paymentSettings.method_configs,
                              PAY_LATER: {
                                ...paymentSettings.method_configs.PAY_LATER,
                                pay_later_terms: e.target.value as any,
                              },
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-white dark:bg-neutral-900"
                      >
                        <option value="NET_7">NET 7 (Trong vòng 7 ngày)</option>
                        <option value="NET_15">NET 15 (Trong vòng 15 ngày)</option>
                        <option value="NET_30">NET 30 (Trong vòng 30 ngày)</option>
                        <option value="NET_45">NET 45 (Trong vòng 45 ngày)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTOR PAYMENT ACCOUNTS */}
        {activeTab === "PAYMENT_ACCOUNTS" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-purple-600" />
                    <span>Danh Sách Tài Khoản Ngân Hàng Nhận Tiền (Actor Accounts)</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Các tài khoản thuộc quyền sở hữu của Doanh nghiệp / Người bán dùng để tạo mã VietQR tự động.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Tài Khoản Ngân Hàng</span>
                </button>
              </div>

              {/* Accounts List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentAccounts.map((acc) => {
                  const isStoreDefault =
                    paymentSettings.default_payment_account_id === acc.id ||
                    (!paymentSettings.default_payment_account_id && acc.is_default);

                  return (
                    <div
                      key={acc.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isStoreDefault
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              {acc.bank_short_name}
                            </span>
                            {isStoreDefault && (
                              <span className="px-2 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                Mặc định Store
                              </span>
                            )}
                            <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Đã Xác Thực</span>
                            </span>
                          </div>
                          <p className="font-mono text-sm font-black text-neutral-800 dark:text-neutral-200 tracking-wider">
                            {acc.account_number}
                          </p>
                          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                            {acc.account_name}
                          </p>
                          <p className="text-[11px] text-neutral-400">{acc.bank_name}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                        {!isStoreDefault ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDefaultPaymentAccount(acc.id);
                              setPaymentSettings({
                                ...paymentSettings,
                                default_payment_account_id: acc.id,
                              });
                            }}
                            className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Đặt Làm Mặc Định
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Đang sử dụng nhận tiền</span>
                        )}

                        {paymentAccounts.length > 1 && !isStoreDefault && (
                          <button
                            type="button"
                            onClick={() => deletePaymentAccount(acc.id)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STORE FULFILLMENT & SHIPPING */}
        {activeTab === "FULFILLMENT" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Phương Thức Vận Chuyển & Giao Hàng Mặc Định</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Thiết lập quy tắc tính phí giao hàng tận nơi và nhận hàng trực tiếp tại showroom.
                </p>
              </div>

              {/* Methods Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fulfillmentSettings.enabled_methods.includes("DELIVERY")}
                    onChange={() => toggleFulfillmentMethod("DELIVERY")}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Giao Hàng Tiêu Chuẩn Toàn Quốc
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Giao hàng qua các đơn vị bưu chính chuyển phát nhanh
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fulfillmentSettings.enabled_methods.includes("STORE_PICKUP")}
                    onChange={() => toggleFulfillmentMethod("STORE_PICKUP")}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Nhận Tại Cửa Hàng / Showroom
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Miễn phí 100%, khách tự đến lấy hàng tại kho
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fulfillmentSettings.enabled_methods.includes("SHIPPING_QUOTE_LATER")}
                    onChange={() => toggleFulfillmentMethod("SHIPPING_QUOTE_LATER")}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Báo Phí Giao Hàng Sau (Quote Later)
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Dành cho hàng cồng kềnh, máy móc hoặc đơn hàng số lượng lớn
                    </span>
                  </div>
                </label>
              </div>

              {/* Fee Rules */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4 text-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Quy Tắc Phí Giao Hàng Mặc Định
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Phí Vận Chuyển Cố Định (đ)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={fulfillmentSettings.fixed_fee}
                      onChange={(e) =>
                        setFulfillmentSettings({
                          ...fulfillmentSettings,
                          fixed_fee: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Miễn Phí Vận Chuyển Cho Đơn Hàng Từ (đ)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={fulfillmentSettings.free_shipping_threshold || 0}
                      onChange={(e) =>
                        setFulfillmentSettings({
                          ...fulfillmentSettings,
                          free_shipping_threshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Địa Chỉ & Hướng Dẫn Nhận Tại Cửa Hàng
                    </label>
                    <textarea
                      rows={2}
                      value={fulfillmentSettings.pickup_config?.address || ""}
                      onChange={(e) =>
                        setFulfillmentSettings({
                          ...fulfillmentSettings,
                          pickup_config: {
                            store_name: store.store_name,
                            address: e.target.value,
                            instructions: fulfillmentSettings.pickup_config?.instructions || "",
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: POLICIES & PUBLIC DISPLAY */}
        {activeTab === "POLICIES" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-3xl bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100">
                    Cấu Hình Chi Tiết Chính Sách & Cờ Hiển Thị Công Khai
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Quản lý 11 cờ bảo mật (Privacy Whitelist) và văn bản cam kết dịch vụ cho Buyer.
                  </p>
                </div>
              </div>

              <Link
                href="/store/public-settings"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Mở Trình Quản Lý Hiển Thị Công Khai</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>LƯU TOÀN BỘ CẤU HÌNH CỬA HÀNG</span>
          </button>
        </div>
      </form>

      {/* Modal: Add Payment Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" />
              <span>Thêm Tài Khoản Ngân Hàng VietQR</span>
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Chọn Ngân Hàng *
                </label>
                <select
                  value={newAccBankBin}
                  onChange={(e) => {
                    const bin = e.target.value;
                    setNewAccBankBin(bin);
                    if (bin === "970422") {
                      setNewAccBankName("Ngân Hàng TMCP Quân Đội (MBBank)");
                      setNewAccShortName("MBBank");
                    } else if (bin === "970436") {
                      setNewAccBankName("Ngân Hàng TMCP Ngoại Thương Việt Nam (Vietcombank)");
                      setNewAccShortName("Vietcombank");
                    } else if (bin === "970407") {
                      setNewAccBankName("Ngân Hàng TMCP Kỹ Thương Việt Nam (Techcombank)");
                      setNewAccShortName("Techcombank");
                    } else if (bin === "970415") {
                      setNewAccBankName("Ngân Hàng TMCP Công Thương Việt Nam (VietinBank)");
                      setNewAccShortName("VietinBank");
                    } else if (bin === "970418") {
                      setNewAccBankName("Ngân Hàng TMCP Đầu Tư & Phát Triển (BIDV)");
                      setNewAccShortName("BIDV");
                    } else if (bin === "970405") {
                      setNewAccBankName("Ngân Hàng Nông Nghiệp & Phát Triển Nông Thôn (Agribank)");
                      setNewAccShortName("Agribank");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold"
                >
                  <option value="970422">MBBank (Ngân Hàng Quân Đội)</option>
                  <option value="970436">Vietcombank (Ngoại Thương Việt Nam)</option>
                  <option value="970407">Techcombank (Kỹ Thương)</option>
                  <option value="970415">VietinBank (Công Thương)</option>
                  <option value="970418">BIDV (Đầu Tư & Phát Triển)</option>
                  <option value="970405">Agribank (Nông Nghiệp)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Số Tài Khoản Ngân Hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="098812345688"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Chủ Tài Khoản (Không Dấu) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="CONG TY TNHH KY THUAT 2K"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-bold text-xs uppercase"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newAccIsDefault}
                  onChange={(e) => setNewAccIsDefault(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                  Đặt làm tài khoản nhận tiền mặc định cho Store
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Lưu Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <QRModal isOpen={showQR} onClose={() => setShowQR(false)} url={storeUrl} title={store.store_name} />
    </div>
  );
}
