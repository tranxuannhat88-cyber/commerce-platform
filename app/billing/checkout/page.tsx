"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Building,
  User,
  Zap,
  Tag,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { BillingPeriod, BillingPlanCode, BillingOrder } from "@/lib/billing/types";
import { BILLING_PLANS, BILLING_CONFIG } from "@/lib/billing/plans-config";
import { BILLING_ADDONS } from "@/lib/billing/addons-config";
import { useCommerceStore } from "@/lib/db/store";
import { UnifiedAuthModal } from "@/components/auth/unified-auth-modal";
import { CopyButton } from "@/components/shared/copy-button";
import confetti from "canvas-confetti";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPlanCode = (searchParams.get("plan") as BillingPlanCode) || "PRO";
  const initialPeriod = (searchParams.get("period") as BillingPeriod) || "MONTHLY";
  const initialAddonCode = searchParams.get("addon") || null;

  const {
    currentUser,
    personalActor,
    organization,
    currentContext,
    subscription,
    createBillingOrder,
    confirmBillingOrder,
  } = useCommerceStore();

  const [selectedPlanCode, setSelectedPlanCode] = useState<BillingPlanCode>(initialPlanCode);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod);
  const [selectedAddonCodes, setSelectedAddonCodes] = useState<string[]>(
    initialAddonCode ? [initialAddonCode] : []
  );

  // Workspace Target (defaults to current active context)
  const [targetActorType, setTargetActorType] = useState<"ORGANIZATION" | "PERSONAL">(
    currentContext?.context_type || "ORGANIZATION"
  );

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active Order & Payment state
  const [activeOrder, setActiveOrder] = useState<BillingOrder | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  const selectedPlan = BILLING_PLANS[selectedPlanCode] || BILLING_PLANS.PRO;
  const isFreePlan = selectedPlanCode === "FREE";

  // Calculations
  const planPrice = isFreePlan ? 0 : selectedPlan.prices[billingPeriod].amount;
  const addonsTotal = selectedAddonCodes.reduce((sum, code) => {
    const addon = BILLING_ADDONS.find((a) => a.code === code);
    return sum + (addon?.price || 0);
  }, 0);

  const subtotal = planPrice + addonsTotal;
  const totalAmount = Math.max(0, subtotal - promoDiscount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (code === "WELCOME2026" || code === "TESTVIP") {
      const discount = Math.round(subtotal * 0.1);
      setPromoDiscount(discount);
      setAppliedPromo(code);
    } else if (code === "FREEPRO") {
      setPromoDiscount(subtotal);
      setAppliedPromo(code);
    } else {
      alert("Mã ưu đãi không hợp lệ.");
    }
  };

  const handleCreatePayment = () => {
    // If not logged in, trigger auth
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const addonSelections = selectedAddonCodes.map((code) => ({
      addonCode: code,
      quantity: 1,
    }));

    const isOrg = targetActorType === "ORGANIZATION";
    const targetActorId = isOrg ? organization.id : personalActor.id;
    const targetActorName = isOrg ? organization.name : (currentUser.full_name || personalActor.display_name);

    const order = createBillingOrder({
      actorId: targetActorId,
      actorType: targetActorType,
      actorName: targetActorName,
      orderType: isFreePlan ? "PLAN_CHANGE" : "NEW_SUBSCRIPTION",
      planCode: selectedPlanCode,
      billingPeriod,
      addonSelections,
      promoCode: appliedPromo || undefined,
    });

    setActiveOrder(order);

    // If 0 VND (FREE or 100% coupon), it's immediately activated
    if (order.total_amount === 0) {
      setIsPaidSuccess(true);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Simulate Instant Webhook Payment
  const handleSimulateWebhook = () => {
    if (!activeOrder) return;
    setIsSimulatingPayment(true);

    setTimeout(() => {
      confirmBillingOrder(activeOrder.id);
      setIsSimulatingPayment(false);
      setIsPaidSuccess(true);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }, 1200);
  };

  const toggleAddon = (code: string) => {
    if (selectedAddonCodes.includes(code)) {
      setSelectedAddonCodes(selectedAddonCodes.filter((c) => c !== code));
    } else {
      setSelectedAddonCodes([...selectedAddonCodes, code]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans pb-20">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/pricing" className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bảng Giá</span>
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bảo mật thanh toán SSL 256-bit</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {!activeOrder || !activeOrder.qr_code_url || activeOrder.status === "PAID" && isPaidSuccess ? (
          /* STEP 1: REVIEW & CONFIGURE CHECKOUT */
          !isPaidSuccess ? (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                  Xác Nhận Đăng Ký Gói Dịch Vụ
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Chọn không gian làm việc và kiểm tra quyền lợi trước khi kích hoạt
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* 1. Target Workspace Selector */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Bạn muốn áp dụng gói này cho:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTargetActorType("ORGANIZATION")}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          targetActorType === "ORGANIZATION"
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-neutral-900 dark:text-neutral-100"
                            : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{organization.name}</p>
                          <p className="text-[10px] text-neutral-500">Doanh nghiệp (Khuyên dùng)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetActorType("PERSONAL")}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          targetActorType === "PERSONAL"
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-neutral-900 dark:text-neutral-100"
                            : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {currentUser?.full_name || "Tài khoản Cá nhân"}
                          </p>
                          <p className="text-[10px] text-neutral-500">Cá nhân kinh doanh nhỏ</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Billing Period Toggle */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Chu kỳ thanh toán:
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBillingPeriod("MONTHLY")}
                        className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          billingPeriod === "MONTHLY"
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        Hàng Tháng
                      </button>

                      <button
                        type="button"
                        onClick={() => setBillingPeriod("ANNUAL")}
                        className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          billingPeriod === "ANNUAL"
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <span>Hàng Năm (12 Tháng)</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Tiết kiệm 2 tháng
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Optional Add-ons */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Mua thêm Add-on (Tùy chọn):
                      </label>
                      <span className="text-[11px] text-neutral-400">Tích hợp ngay</span>
                    </div>

                    <div className="space-y-2">
                      {BILLING_ADDONS.slice(0, 3).map((addon) => {
                        const isSelected = selectedAddonCodes.includes(addon.code);
                        return (
                          <div
                            key={addon.id}
                            onClick={() => toggleAddon(addon.code)}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20"
                                : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-neutral-300 dark:border-neutral-600"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div>
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                  {addon.name}
                                </p>
                                <p className="text-[10px] text-neutral-400">{addon.description}</p>
                              </div>
                            </div>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
                              +{formatVND(addon.price)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Promo Code */}
                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Mã ưu đãi (Thử: WELCOME2026)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-2xl cursor-pointer hover:opacity-90"
                    >
                      Áp Dụng
                    </button>
                  </form>
                </div>

                {/* Right: Order Summary Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5 sticky top-24">
                  <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    Tóm Tắt Thanh Toán
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Gói {selectedPlan.name} ({billingPeriod === "ANNUAL" ? "1 Năm" : "1 Tháng"}):
                      </span>
                      <span className="font-bold">{formatVND(planPrice)}</span>
                    </div>

                    {addonsTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Add-ons bổ sung:</span>
                        <span className="font-bold">+{formatVND(addonsTotal)}</span>
                      </div>
                    )}

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Giảm giá ({appliedPromo}):</span>
                        <span>-{formatVND(promoDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Thuế VAT:</span>
                      <span>0đ (Đã bao gồm)</span>
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline">
                      <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                        TỔNG THANH TOÁN:
                      </span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                        {formatVND(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreatePayment}
                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>{isFreePlan ? "KÍCH HOẠT GÓI MIỄN PHÍ" : "TIẾP TỤC THANH TOÁN VIETQR"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
                    Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ & Chính sách kích hoạt của Commerce Platform.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 3: ACTIVATION SUCCESS */
            <div className="max-w-md mx-auto py-12 text-center space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
                  {activeOrder?.order_number}
                </span>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                  Thanh Toán Thành Công!
                </h2>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Gói dịch vụ <strong className="text-blue-600">{selectedPlan.name}</strong> đã được kích hoạt thành công cho Workspace của bạn.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-left space-y-2">
                <div className="flex justify-between text-neutral-500">
                  <span>Workspace:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{organization.name}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Chu kỳ:</span>
                  <span className="font-bold">{billingPeriod === "ANNUAL" ? "12 Tháng" : "1 Tháng"}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Số tiền:</span>
                  <span className="font-bold text-emerald-600">{formatVND(activeOrder?.total_amount || 0)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/"
                  className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>VÀO WORKSPACE NGAY</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/settings/security"
                  className="block text-xs text-neutral-500 hover:text-neutral-800 py-1"
                >
                  Xem Quản lý Gói & Hạn mức
                </Link>
              </div>
            </div>
          )
        ) : (
          /* STEP 2: VIETQR PAYMENT DISPLAY */
          <div className="max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-6 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Đang chờ chuyển khoản VietQR</span>
              </div>
              <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                Thanh Toán Đơn Hàng #{activeOrder.order_number}
              </h2>
              <p className="text-xs text-neutral-500">
                Mở ứng dụng ngân hàng quét mã QR để kích hoạt gói tức thì
              </p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-3xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-md">
                <img
                  src={activeOrder.qr_code_url}
                  alt="VietQR Payment"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                <span>Số tiền:</span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  {formatVND(activeOrder.total_amount)}
                </span>
                <CopyButton text={activeOrder.total_amount.toString()} label="Copy" className="text-[10px] py-1" />
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="space-y-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Ngân hàng:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeOrder.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold">
                  <span>{activeOrder.account_number}</span>
                  <CopyButton text={activeOrder.account_number} label="Copy" className="text-[10px] py-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Chủ tài khoản:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeOrder.account_name}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-500">Nội dung chuyển:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-blue-600">
                  <span>{activeOrder.payment_reference}</span>
                  <CopyButton text={activeOrder.payment_reference} label="Copy" className="text-[10px] py-0.5" />
                </div>
              </div>
            </div>

            {/* Simulated Webhook for Public Testing */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={isSimulatingPayment}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                {isSimulatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG ĐỐI SOÁT WEBHOOK...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>⚡ MÔ PHỎNG WEBHOOK THANH TOÁN (PUBLIC TEST)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="w-full py-2.5 text-xs text-neutral-400 hover:text-neutral-600 text-center"
              >
                ← Thay đổi gói hoặc phương thức
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Unified Auth Modal if guest attempts checkout */}
      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
        title="Đăng Nhập Để Kích Hoạt Gói"
        subtitle="Xác thực số điện thoại để gắn gói dịch vụ vào Workspace của bạn"
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
