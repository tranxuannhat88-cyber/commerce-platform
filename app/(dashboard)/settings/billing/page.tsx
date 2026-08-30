"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Zap,
  TrendingUp,
  Database,
  ShoppingBag,
  Users,
  Store,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  Clock,
  Sparkles,
  Info,
  Calendar,
  X,
  Tag,
} from "lucide-react";
import { formatVND, formatDate } from "@/lib/utils";
import { useCommerceStore } from "@/lib/db/store";
import { BILLING_PLANS } from "@/lib/billing/plans-config";
import { BILLING_ADDONS } from "@/lib/billing/addons-config";
import { EntitlementService } from "@/lib/billing/entitlement-service";
import { BillingAddon, BillingPlanCode } from "@/lib/billing/types";

export default function BillingDashboardPage() {
  const {
    organization,
    subscription,
    billingOrders,
    billingInvoices,
    orders,
    offers,
    products,
    cancelSubscription,
    reactivateSubscription,
    schedulePlanDowngrade,
    createBillingOrder,
  } = useCommerceStore();

  const [selectedAddon, setSelectedAddon] = useState<BillingAddon | null>(null);
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);

  // Current Plan
  const currentPlan = BILLING_PLANS[subscription.plan_code] || BILLING_PLANS.PRO;
  const isFree = subscription.plan_code === "FREE";

  // Calculate Realtime Usages
  const confirmedOrdersCount = orders.filter(
    (o) => o.order_status === "CONFIRMED" || o.order_status === "COMPLETED" || o.order_status === "PREPARING"
  ).length;

  const activeProductsCount = offers.filter((o) => o.status === "ACTIVE").length;
  const simulatedStorageBytes = 12.4 * 1024 * 1024 * 1024; // 12.4 GB simulated
  const teamMembersCount = 3;
  const storesCount = 1;

  const usage = EntitlementService.getUsage(
    subscription,
    confirmedOrdersCount,
    activeProductsCount,
    simulatedStorageBytes,
    teamMembersCount,
    storesCount
  );

  const txStatus = EntitlementService.getUsageStatus(
    usage.transactions_used,
    usage.transactions_limit
  );
  const prodStatus = EntitlementService.getUsageStatus(
    usage.products_used,
    usage.products_limit
  );
  const storageStatus = EntitlementService.getUsageStatus(
    usage.storage_bytes_used,
    usage.storage_bytes_limit
  );
  const usersStatus = EntitlementService.getUsageStatus(
    usage.users_used,
    usage.users_limit
  );
  const storesStatus = EntitlementService.getUsageStatus(
    usage.stores_used,
    usage.stores_limit
  );

  // Active Addon Codes in Subscription
  const activeAddonCodes = subscription.items
    .filter((i) => i.item_type === "ADDON" && i.addon_code)
    .map((i) => i.addon_code as string);

  const smartUpgrade = EntitlementService.calculateSmartUpgrade(
    subscription.plan_code,
    activeAddonCodes
  );

  const handleBuyAddon = (addon: BillingAddon) => {
    setSelectedAddon(addon);
    setAddonQuantity(1);
  };

  const handleConfirmAddonPurchase = () => {
    if (!selectedAddon) return;
    createBillingOrder({
      actorId: organization.id,
      actorType: "ORGANIZATION",
      actorName: organization.name,
      orderType: "ADDON_PURCHASE",
      addonSelections: [{ addonCode: selectedAddon.code, quantity: addonQuantity }],
    });
    setSelectedAddon(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cài đặt chung</span>
          </Link>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-blue-600" />
            <span>Gói Dịch Vụ & Hạn Mức Sử Dụng</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Quản lý gói thuê bao, theo dõi định mức tài nguyên và lịch sử thanh toán
          </p>
        </div>

        <Link
          href="/pricing"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Xem Bảng Giá Tất Cả Các Gói</span>
        </Link>
      </div>

      {/* 1. CURRENT SUBSCRIPTION CARD */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black backdrop-blur-xs">
                GÓI HIỆN TẠI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black">
                {subscription.status === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : subscription.status}
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <h2 className="text-3xl font-black tracking-tight">{currentPlan.name}</h2>
              <span className="text-blue-100 text-xs font-semibold">
                ({subscription.billing_period === "ANNUAL" ? "Hàng Năm" : "Hàng Tháng"})
              </span>
            </div>
            <p className="text-xs text-blue-100">{currentPlan.tagline}</p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 bg-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-xs text-blue-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {subscription.cancel_at_period_end ? "Hết hạn vào ngày:" : "Tự động gia hạn vào:"}
              </span>
            </div>
            <p className="text-sm font-black font-mono">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-blue-700 font-bold text-xs shadow-md transition-all"
            >
              Nâng Cấp Gói
            </Link>

            {subscription.cancel_at_period_end ? (
              <button
                type="button"
                onClick={reactivateSubscription}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Tiếp Tục Gia Hạn
              </button>
            ) : !isFree ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs cursor-pointer"
              >
                Hủy Tự Động Gia Hạn
              </button>
            ) : null}
          </div>

          <span className="text-[11px] text-blue-100">
            Mã định danh thuê bao: <code className="font-mono">{subscription.id}</code>
          </span>
        </div>
      </div>

      {/* Smart Upgrade Recommendation Banner */}
      {smartUpgrade.should_upgrade && (
        <div className="p-5 rounded-3xl bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              <Sparkles className="w-3 h-3 text-amber-200" />
              <span>GỢI Ý TỐI ƯU CHI PHÍ</span>
            </div>
            <h4 className="text-base font-black">
              Nâng cấp lên gói {smartUpgrade.recommended_plan_code} để tiết kiệm {formatVND(smartUpgrade.monthly_savings)}/tháng!
            </h4>
            <p className="text-xs text-amber-100 max-w-xl">
              Tổng chi phí gói hiện tại kèm Add-ons ({formatVND(smartUpgrade.current_total_monthly)}/tháng) cao hơn gói {smartUpgrade.recommended_plan_code} ({formatVND(smartUpgrade.recommended_plan_monthly_price)}/tháng) nhưng ít quyền lợi hơn.
            </p>
          </div>

          <Link
            href={`/billing/checkout?plan=${smartUpgrade.recommended_plan_code}`}
            className="px-5 py-3 rounded-2xl bg-white text-orange-700 hover:bg-neutral-100 font-black text-xs shadow-md shrink-0 whitespace-nowrap"
          >
            NÂNG CẤP {smartUpgrade.recommended_plan_code} NGAY
          </Link>
        </div>
      )}

      {/* 2. REALTIME USAGE METERS (5 Core Metrics) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
              Định Mức Tài Nguyên Trong Chu Kỳ
            </h3>
            <p className="text-xs text-neutral-500">
              Tự động reset vào ngày đầu tiên của chu kỳ thanh toán tiếp theo
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 font-mono">
            {organization.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Metric 1: Transactions */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Giao dịch trong tháng
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${txStatus.bgClass} ${txStatus.textClass}`}>
                {txStatus.badgeText}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{usage.transactions_used} giao dịch</span>
                <span className="text-neutral-400">
                  Hạn mức: {usage.transactions_limit || "Không giới hạn"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${txStatus.barClass}`}
                  style={{ width: `${txStatus.percent}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Không bao giờ chặn đơn khách</span>
              <button
                type="button"
                onClick={() => handleBuyAddon(BILLING_ADDONS[1])}
                className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+500 Giao dịch (99k)</span>
              </button>
            </div>
          </div>

          {/* Metric 2: Active Products */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Sản phẩm đang hoạt động
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prodStatus.bgClass} ${prodStatus.textClass}`}>
                {prodStatus.badgeText}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{usage.products_used} sản phẩm</span>
                <span className="text-neutral-400">
                  Hạn mức: {usage.products_limit || "Không giới hạn"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${prodStatus.barClass}`}
                  style={{ width: `${prodStatus.percent}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Lưu Draft không giới hạn</span>
              <button
                type="button"
                onClick={() => handleBuyAddon(BILLING_ADDONS[5])}
                className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+500 Sản phẩm (49k/th)</span>
              </button>
            </div>
          </div>

          {/* Metric 3: Storage */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Dung lượng lưu trữ (Storage)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${storageStatus.bgClass} ${storageStatus.textClass}`}>
                {storageStatus.badgeText}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{EntitlementService.formatBytes(usage.storage_bytes_used)}</span>
                <span className="text-neutral-400">
                  Hạn mức: {EntitlementService.formatBytes(usage.storage_bytes_limit)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${storageStatus.barClass}`}
                  style={{ width: `${storageStatus.percent}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Không xóa file khi hết hạn</span>
              <button
                type="button"
                onClick={() => handleBuyAddon(BILLING_ADDONS[9])}
                className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+10 GB Dung lượng (29k/th)</span>
              </button>
            </div>
          </div>

          {/* Metric 4: Users & Stores */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Người dùng & Cửa hàng
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${usersStatus.bgClass} ${usersStatus.textClass}`}>
                {usersStatus.badgeText}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span>{usage.users_used} / {usage.users_limit || "∞"} Nhân sự</span>
                <span className="text-neutral-400">
                  {usage.stores_used} / {usage.stores_limit || "∞"} Storefront
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${usersStatus.barClass}`}
                  style={{ width: `${usersStatus.percent}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Tài khoản khách mua: Miễn phí</span>
              <button
                type="button"
                onClick={() => handleBuyAddon(BILLING_ADDONS[13])}
                className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+1 Thành viên (39k/th)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BILLING HISTORY & INVOICES */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
              Lịch Sử Thanh Toán & Hóa Đơn
            </h3>
          </div>
          <span className="text-xs text-neutral-400">{billingOrders.length} giao dịch</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold text-[11px]">
                <th className="py-3 px-3">Mã Đơn</th>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-3">Nội Dung</th>
                <th className="py-3 px-3">Số Tiền</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Hóa Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {billingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {order.order_number}
                  </td>
                  <td className="py-3 px-3 text-neutral-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3 px-3">
                    {order.items.map((i) => i.description).join(", ")}
                  </td>
                  <td className="py-3 px-3 font-black text-neutral-900 dark:text-neutral-100">
                    {formatVND(order.total_amount)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{order.status === "PAID" ? "Đã Thanh Toán" : order.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Mã hóa đơn: INV-${order.order_number}`)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] cursor-pointer"
                    >
                      INV-{order.order_number.slice(-4)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADDON PURCHASE MODAL */}
      {selectedAddon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setSelectedAddon(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                <span>MUA ADD-ON MỞ RỘNG</span>
              </div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                {selectedAddon.name}
              </h3>
              <p className="text-xs text-neutral-500">{selectedAddon.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Đơn giá:</span>
                <span className="font-bold">{formatVND(selectedAddon.price)} / gói</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span>Số lượng gói:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddonQuantity(Math.max(1, addonQuantity - 1))}
                    className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold w-6 text-center">{addonQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setAddonQuantity(addonQuantity + 1)}
                    className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700 text-sm font-black">
                <span>Tổng thanh toán:</span>
                <span className="text-blue-600">
                  {formatVND(selectedAddon.price * addonQuantity)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmAddonPurchase}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              TIẾN HÀNH KÍCH HOẠT ADD-ON NGAY
            </button>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                Xác Nhận Hủy Tự Động Gia Hạn?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Gói {subscription.plan_code} vẫn sẽ duy trì hoạt động bình thường cho đến hết ngày{" "}
                <strong>{formatDate(subscription.current_period_end)}</strong>. Dữ liệu của bạn sẽ không bị xóa.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold"
              >
                Giữ Gói
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelSubscription();
                  setShowCancelModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Xác Nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
