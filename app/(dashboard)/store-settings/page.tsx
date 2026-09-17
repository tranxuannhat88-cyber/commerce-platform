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
  Eye,
  Share2,
  Sliders,
  Palette,
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
  StoreTemplate,
} from "@/types";
import { PaymentSettingsService } from "@/lib/services/payment-settings-service";
import { FulfillmentService } from "@/lib/services/fulfillment-service";

type ActiveTab =
  | "INFO"
  | "PAYMENT_METHODS"
  | "PAYMENT_ACCOUNTS"
  | "FULFILLMENT"
  | "POLICIES";

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
  } = useCommerceStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("INFO");

  // Tab 1: Info State
  const [storeName, setStoreName] = useState(store.store_name || "");
  const [slug, setSlug] = useState(store.slug || "");
  const [description, setDescription] = useState(store.description || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [email, setEmail] = useState(store.email || "");
  const [address, setAddress] = useState(store.address || "");

  // Tab 3: Store Payment Methods State
  const [paymentSettings, setPaymentSettings] = useState<StorePaymentSettings>(
    store.advanced_payment_settings || PaymentSettingsService.getStorePaymentSettings(store)
  );

  // Tab 4: Payment Accounts State & Add Modal
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccBankBin, setNewAccBankBin] = useState("970422");
  const [newAccBankName, setNewAccBankName] = useState("Ngân Hàng TMCP Quân Đội (MBBank)");
  const [newAccShortName, setNewAccShortName] = useState("MBBank");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccIsDefault, setNewAccIsDefault] = useState(false);

  // Tab 5: Fulfillment State
  const [fulfillmentSettings, setFulfillmentSettings] = useState<StoreFulfillmentSettings>(
    store.advanced_fulfillment_settings || FulfillmentService.getStoreFulfillmentSettings(store)
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const storeUrl = AppUrlService.getStoreUrl(slug);

  // Synchronize with store updates
  useEffect(() => {
    if (store) {
      if (store.store_name) setStoreName(store.store_name);
      if (store.slug) setSlug(store.slug);
      if (store.description) setDescription(store.description);
      if (store.phone) setPhone(store.phone);
      if (store.email) setEmail(store.email);
      if (store.address) setAddress(store.address);
      if (store.advanced_payment_settings) {
        setPaymentSettings(store.advanced_payment_settings);
      }
      if (store.advanced_fulfillment_settings) {
        setFulfillmentSettings(store.advanced_fulfillment_settings);
      }
    }
  }, [store]);

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const autoOldSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug || slug === autoOldSlug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSlug =
      slug.trim() ||
      storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
      "my-store";

    updateStore({
      store_name: storeName.trim(),
      slug: cleanSlug,
      description: description.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      advanced_payment_settings: paymentSettings,
      advanced_fulfillment_settings: fulfillmentSettings,
      fulfillment_settings: fulfillmentSettings,
    });

    setSlug(cleanSlug);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
              Thiết lập cửa hàng
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Cấu hình thông tin, giao diện, thanh toán, tài khoản nhận tiền, vận chuyển và chính sách cửa hàng.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/my-store"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <StoreIcon className="w-4 h-4 text-blue-600" />
            <span>Xem Cửa hàng của tôi</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Mã QR</span>
          </button>
          <CopyButton text={storeUrl} label="Copy Link Cửa Hàng" className="py-2 text-xs" />
          <Link
            href={`/s/${slug || "invamax-workspace"}`}
            target="_blank"
            title="Mở trang cửa hàng công khai trong tab mới"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <span>Mở trang công khai</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công toàn bộ thiết lập Cửa hàng!</span>
        </div>
      )}

      {/* Navigation Tabs (5 Business Tabs) */}
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
          onClick={() => setActiveTab("PAYMENT_METHODS")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "PAYMENT_METHODS"
              ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>2. Phương Thức Thanh Toán</span>
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
          <span>3. Tài Khoản Nhận Tiền</span>
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
          <span>4. Vận Chuyển & Giao Hàng</span>
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
          <span>5. Chính Sách & Điều Khoản</span>
        </button>
      </div>

      {/* FORM TABS: INFO, PAYMENT METHODS, PAYMENT ACCOUNTS, FULFILLMENT, POLICIES */}
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

              {/* Visual Direct Editing Notice & Deep-link */}
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B894] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs overflow-hidden">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span>
                        {(storeName || "Store")
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Logo, Ảnh bìa & Giao diện cửa hàng
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Tùy chỉnh Logo, Ảnh bìa, Màu sắc thương hiệu và Bố cục trực quan tại &quot;Cửa hàng của tôi&quot;.
                    </p>
                  </div>
                </div>
                <Link
                  href="/my-store"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white text-xs font-bold transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                >
                  <span>Chỉnh sửa trực quan ↗</span>
                </Link>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Tên cửa hàng / thương hiệu *
                    </label>
                    <input
                      type="text"
                      required
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
                        /s/
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

          {/* TAB 3: STORE PAYMENT METHODS */}
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

          {/* TAB 4: ACTOR PAYMENT ACCOUNTS */}
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

                          {paymentAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                deletePaymentAccount(acc.id);
                                const remaining = paymentAccounts.filter((a) => a.id !== acc.id);
                                if (remaining.length > 0) {
                                  setPaymentSettings((prev) => ({
                                    ...prev,
                                    default_payment_account_id: remaining[0].id,
                                  }));
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-xs p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                              title="Xóa tài khoản này"
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

          {/* TAB 5: STORE FULFILLMENT & SHIPPING */}
          {activeTab === "FULFILLMENT" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Phương Thức Vận Chuyển & Giao Hàng Mặc Định</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Bật/tắt các phương thức giao hàng và cấu hình mức phí, hạn mức freeship trực tiếp bên dưới mỗi phương thức.
                  </p>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* 1. Fixed fee */}
                  <div
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      fulfillmentSettings.enable_fixed_fee !== false
                        ? "bg-white dark:bg-neutral-900 border-blue-500/80 ring-1 ring-blue-500/20 shadow-xs"
                        : "bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={fulfillmentSettings.enable_fixed_fee !== false}
                          onChange={(e) =>
                            setFulfillmentSettings({
                              ...fulfillmentSettings,
                              enable_fixed_fee: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                            Giao Hàng Tiêu Chuẩn / Đồng Giá Trong Khu Vực
                          </span>
                          <span className="text-neutral-500 text-[11px]">
                            Áp dụng mức phí cố định cho khách mua trong phạm vi giao hàng của cửa hàng
                          </span>
                        </div>
                      </label>
                    </div>

                    {fulfillmentSettings.enable_fixed_fee !== false && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            Phí giao hàng (VND)
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
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            Miễn phí giao hàng từ (VND)
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
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            Bán kính phục vụ tối đa (km)
                          </label>
                          <input
                            type="number"
                            value={fulfillmentSettings.fixed_fee_distance_km || 15}
                            onChange={(e) =>
                              setFulfillmentSettings({
                                ...fulfillmentSettings,
                                fixed_fee_distance_km: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Pickup at store */}
                  <div
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      fulfillmentSettings.enabled_methods.includes("STORE_PICKUP")
                        ? "bg-white dark:bg-neutral-900 border-blue-500/80 ring-1 ring-blue-500/20 shadow-xs"
                        : "bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 opacity-80"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fulfillmentSettings.enabled_methods.includes("STORE_PICKUP")}
                        onChange={() => toggleFulfillmentMethod("STORE_PICKUP")}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                          Nhận Hàng Trực Tiếp Tại Cửa Hàng / Kho Bãi (Pickup)
                        </span>
                        <span className="text-neutral-500 text-[11px]">
                          Khách đến lấy hàng trực tiếp tại địa chỉ cửa hàng (Miễn phí 100%)
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* 3. Quote later */}
                  <div
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      fulfillmentSettings.enabled_methods.includes("SHIPPING_QUOTE_LATER")
                        ? "bg-white dark:bg-neutral-900 border-blue-500/80 ring-1 ring-blue-500/20 shadow-xs"
                        : "bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/80 opacity-80"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none">
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
                          Dành cho hàng cồng kềnh, máy móc hoặc đơn hàng số lượng lớn (Người bán sẽ liên hệ báo cước vận chuyển thực tế trước khi giao)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: POLICIES & PUBLIC DISPLAY */}
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

          {/* Submit Bar with Instant Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              type="submit"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                savedSuccess
                  ? "bg-emerald-600 shadow-emerald-600/30 scale-[1.02]"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 active:scale-95"
              }`}
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? "✓ ĐÃ LƯU THÀNH CÔNG!" : "LƯU CẤU HÌNH CỬA HÀNG"}</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thiết lập đã được lưu và đồng bộ lên toàn hệ thống.</span>
              </span>
            )}
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
