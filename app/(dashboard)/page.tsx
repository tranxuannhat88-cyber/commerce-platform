"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Send,
  FileQuestion,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  Share2,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Store,
  CreditCard,
  ChevronRight,
  Activity,
  Tag,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatNumber, formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";
import { QRModal } from "@/components/shared/qr-modal";
import { AppUrlService } from "@/lib/services/url";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const {
    store,
    organization,
    currentContext,
    currentUser,
    offers,
    requests,
    quotations,
    orders,
    inventory,
    financials,
    confirmPayment,
  } = useCommerceStore();

  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [simulatingPaymentId, setSimulatingPaymentId] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => o.order_status === "NEW" || o.order_status === "PREPARING");
  const lowStockItems = inventory.filter((i) => i.available <= i.minimum_stock);
  const activeRequests = requests.filter((r) => r.status === "OPEN" || r.status === "QUOTING");
  const receivedQuotations = quotations.filter((q) => q.status === "SUBMITTED" || q.status === "VIEWED");

  const storeUrl = store.slug ? AppUrlService.getStoreUrl(store.slug) : "";

  // Real actor name from store
  const actorName =
    currentContext.context_type === "PERSONAL"
      ? (currentUser?.full_name || currentContext.display_name || "Quý đối tác")
      : (organization.name && organization.name !== "Chưa có tổ chức" ? organization.name : (currentUser?.full_name || "Doanh nghiệp"));

  const contextLabel =
    currentContext.context_type === "PERSONAL"
      ? "Cá nhân kinh doanh"
      : `Tổ chức • ${currentContext.role || "Chủ doanh nghiệp"}`;

  // Interactive Webhook Simulator for Testing Acceptance Flow
  const handleSimulateWebhook = (orderId: string) => {
    setSimulatingPaymentId(orderId);
    setTimeout(() => {
      confirmPayment(orderId);
      setSimulatingPaymentId(null);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 800);
  };

  // 6 Quick Action items from Screen 02
  const quickActions = [
    {
      label: "Cửa hàng",
      href: store.slug ? `/s/${store.slug}` : "/store",
      icon: Store,
      color: "text-[#00A88F] bg-[#E6F7F4] dark:bg-teal-950/60",
      border: "border-teal-200/70 dark:border-teal-900/50",
    },
    {
      label: "Offer",
      href: "/sell/offers",
      icon: Tag,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60",
      border: "border-blue-200/70 dark:border-blue-900/50",
    },
    {
      label: "RFQ",
      href: "/buy/requests",
      icon: FileQuestion,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60",
      border: "border-amber-200/70 dark:border-amber-900/50",
    },
    {
      label: "Giao dịch",
      href: "/sell/orders",
      icon: ShoppingBag,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60",
      border: "border-purple-200/70 dark:border-purple-900/50",
    },
    {
      label: "Thanh toán",
      href: "/finance",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60",
      border: "border-emerald-200/70 dark:border-emerald-900/50",
    },
    {
      label: "Danh tiếng",
      href: "/transactions",
      icon: ShieldCheck,
      color: "text-[#007C73] bg-[#E6F7F4] dark:bg-teal-950/60",
      border: "border-teal-200/70 dark:border-teal-900/50",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* GREETING & PROFILE HERO CARD (Screen 02) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0D1B2A] text-white p-6 md:p-8 shadow-xl border border-neutral-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar / Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-[#00A88F] to-[#00D1C2] p-0.5 shadow-lg shadow-teal-900/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0D1B2A] flex items-center justify-center font-black text-xl sm:text-2xl text-[#00D1C2]">
                {actorName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Xin chào,</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00A88F]/20 text-[#00D1C2] text-[11px] font-semibold border border-[#00A88F]/30">
                  <ShieldCheck className="w-3 h-3 text-[#00D1C2]" />
                  <span>{contextLabel}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                {actorName}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300">
                Mã định danh: <span className="font-mono text-neutral-300">{store.slug || "hinex-node"}</span> • Hệ sinh thái giao dịch số Hinex
              </p>
            </div>
          </div>

          {/* Quick Actions & Store QR */}
          <div className="flex flex-wrap items-center gap-2.5">
            {store.slug ? (
              <>
                <button
                  onClick={() => setSelectedQR({ url: storeUrl, title: "QR Cửa Hàng", subtitle: store.store_name })}
                  className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#00D1C2]" />
                  <span>QR Cửa Hàng</span>
                </button>
                <CopyButton
                  text={storeUrl}
                  label="Copy Link"
                  className="py-2 sm:py-2.5 px-3.5 sm:px-4 text-xs font-semibold bg-[#00A88F] text-white border-none hover:bg-[#007C73]"
                />
              </>
            ) : (
              <Link
                href="/store"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A88F] hover:bg-[#007C73] text-white text-xs font-bold shadow-lg shadow-teal-900/40 transition-all cursor-pointer"
              >
                <span>+ Tạo Cửa Hàng Đầu Tiên</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#00A88F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-64 h-64 bg-[#00D1C2]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* QUICK ACTIONS 6-GRID (Exact Screen 02 style) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Truy Cập Nhanh
          </h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="group p-3 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#00A88F]/50 dark:hover:border-[#00A88F]/50 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center gap-2"
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${action.color} border ${action.border} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-[#007C73] dark:group-hover:text-[#00D1C2] transition-colors">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW / KPI METRICS (REAL USER METRICS ONLY) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Doanh số */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Tổng Doanh Số</span>
            <div className="w-7 h-7 rounded-lg bg-[#E6F7F4] dark:bg-teal-950 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#00A88F]" />
            </div>
          </div>
          <div className="mt-3 text-lg sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            {formatVND(financials.totalSales)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">
            {financials.ordersCount} giao dịch ghi nhận
          </p>
        </div>

        {/* Tiền đã thu */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Tiền Đã Thu (Cash)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatVND(financials.totalCashReceived)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">
            Còn phải thu: <span className="font-semibold text-amber-600">{formatVND(financials.totalReceivable)}</span>
          </p>
        </div>

        {/* Lãi gộp */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Lãi Gộp</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatVND(financials.grossProfit)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">
            Giá vốn: {formatVND(financials.totalCOGS)}
          </p>
        </div>

        {/* Lợi nhuận ước tính */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Lợi Nhuận Ước Tính</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-lg sm:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            {formatVND(financials.estimatedNetProfit)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500 truncate">
            Chi phí vận hành: {formatVND(financials.totalOperatingExpenses)}
          </p>
        </div>
      </div>

      {/* RECENT TRANSACTIONS / GIAO DỊCH GẦN ĐÂY (Screen 02 Component) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F4] dark:bg-teal-950 flex items-center justify-center text-[#00A88F]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                Giao Dịch Gần Đây
              </h3>
              <p className="text-xs text-neutral-500">Nhật ký giao dịch thực tế trên nền tảng Hinex</p>
            </div>
          </div>
          <Link
            href="/sell/orders"
            className="text-xs font-semibold text-[#007C73] dark:text-[#00D1C2] hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả ({orders.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700 space-y-2">
            <p className="text-xs text-neutral-400 font-medium">Chưa có giao dịch hoặc đơn hàng nào</p>
            <Link
              href="/sell/offers"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00A88F] hover:bg-[#007C73] text-white font-bold text-xs transition-colors shadow-xs"
            >
              <span>+ Tạo Offer để bắt đầu bán</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {orders.slice(0, 5).map((order) => {
              const isPaid = order.payment?.payment_status === "PAID";
              return (
                <div
                  key={order.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isPaid
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-600"
                    }`}>
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {order.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isPaid
                            ? "bg-[#E6F7F4] text-[#007C73] dark:bg-teal-950 dark:text-[#00D1C2]"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                        {order.customer_name || "Khách mua"} • {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {formatVND(order.total_amount)}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {order.items?.length || 1} sản phẩm
                      </span>
                    </div>

                    <Link
                      href={`/transaction/${order.id}/verify`}
                      target="_blank"
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#007C73] dark:text-[#00D1C2] bg-[#E6F7F4] dark:bg-teal-950/50 hover:bg-teal-100 transition-colors"
                      title="Xem Hộ Chiếu Giao Dịch"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Passport</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DUAL WORKSPACE HUBS (SUPPLY SIDE & DEMAND SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* HUB 1: SUPPLY SIDE (BÁN HÀNG & OFFERS) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                🏷️
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Kênh Bán Hàng (Supply Side)
                </h3>
                <p className="text-xs text-neutral-500">Tạo Offer → Gửi link → Nhận đơn</p>
              </div>
            </div>
            <Link
              href="/sell/offers"
              className="text-xs font-semibold text-[#007C73] dark:text-[#00D1C2] hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Active Offers Preview */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Offers Đang Bán ({offers.length})
            </div>
            {offers.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700 space-y-2">
                <p className="text-xs text-neutral-400 font-medium">Chưa có sản phẩm hoặc dịch vụ nào</p>
                <Link
                  href="/sell/offers"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A88F] hover:bg-[#007C73] text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <span>+ Tạo Offer Đầu Tiên</span>
                </Link>
              </div>
            ) : (
              offers.slice(0, 3).map((offer) => {
                const offerLink = AppUrlService.getOfferUrl(store.slug, offer.slug);
                return (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={offer.image_url || "https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=100"}
                        alt={offer.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {offer.name}
                        </p>
                        <p className="text-xs text-[#00A88F] font-bold mt-0.5">
                          {formatVND(offer.price)}
                          <span className="ml-2 text-[10px] text-neutral-400 font-normal">
                            [{offer.offer_type}]
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedQR({ url: offerLink, title: offer.name, subtitle: formatVND(offer.price) })}
                        className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/50 transition-colors cursor-pointer"
                        title="Mã QR Offer"
                      >
                        <QrCode className="w-4 h-4 text-[#00A88F]" />
                      </button>
                      <CopyButton text={offerLink} label="Link" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pending Orders Action */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Đơn Bán Cần Xử Lý ({pendingOrders.length})
              </span>
              <Link href="/sell/orders" className="text-xs text-[#007C73] dark:text-[#00D1C2] hover:underline">
                Chi tiết
              </Link>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">Không có đơn hàng nào chờ xử lý</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.slice(0, 2).map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {order.order_number}
                      </span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {order.customer_name} ({formatVND(order.total_amount)})
                      </span>
                    </div>

                    {order.payment?.payment_status === "UNPAID" && (
                      <button
                        onClick={() => handleSimulateWebhook(order.id)}
                        disabled={simulatingPaymentId === order.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{simulatingPaymentId === order.id ? "Đang xử lý..." : "Test Webhook Pay"}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HUB 2: DEMAND SIDE (MUA HÀNG & RFQ / BÁO GIÁ) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                🛒
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Kênh Mua Hàng (Demand Side / RFQ)
                </h3>
                <p className="text-xs text-neutral-500">Tạo Yêu Cầu → Gửi Zalo → Nhận Báo Giá</p>
              </div>
            </div>
            <Link
              href="/buy/requests"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Active RFQ Requests Preview */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Yêu Cầu Đang Mở Báo Giá ({activeRequests.length})
            </div>
            {activeRequests.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700 space-y-2">
                <p className="text-xs text-neutral-400 font-medium">Chưa có yêu cầu mua sắm hoặc báo giá nào</p>
                <Link
                  href="/buy/requests"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <span>+ Tạo Yêu Cầu Đầu Tiên</span>
                </Link>
              </div>
            ) : (
              activeRequests.slice(0, 3).map((req) => {
                const reqLink = AppUrlService.getRequestUrl(req.request_number);
                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          {req.request_number}
                        </span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {req.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Ngân sách: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{req.target_budget ? formatVND(req.target_budget) : "Thỏa thuận"}</span> • Đã nhận <span className="font-bold text-emerald-600">{req.quotations_count || 0}</span> báo giá
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedQR({ url: reqLink, title: req.request_number, subtitle: req.title })}
                        className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/50 transition-colors cursor-pointer"
                        title="Mã QR Request"
                      >
                        <QrCode className="w-4 h-4 text-emerald-600" />
                      </button>
                      <CopyButton text={reqLink} label="Link RFQ" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quotations Comparison Prompt */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Báo Giá Mới Nhận ({receivedQuotations.length})
              </span>
              <Link href="/buy/quotations" className="text-xs text-emerald-600 hover:underline">
                So sánh & Chốt đơn
              </Link>
            </div>
            {receivedQuotations.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3 text-center">Chưa có báo giá mới</p>
            ) : (
              <div className="space-y-2">
                {receivedQuotations.slice(0, 2).map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {q.guest_company_name || q.guest_seller_name || "Nhà cung cấp"}
                      </span>
                      <span className="ml-2 text-emerald-600 font-bold">
                        {formatVND(q.total)}
                      </span>
                    </div>
                    <Link
                      href={`/buy/quotations`}
                      className="text-xs font-semibold text-[#007C73] dark:text-[#00D1C2] hover:underline"
                    >
                      Xem & Duyệt
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LOW STOCK & INVENTORY ALERTS */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Cảnh báo tồn kho: Có {lowStockItems.length} sản phẩm sắp hết hàng!
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {lowStockItems.map((i) => `${i.offer_name} (còn ${i.available})`).join(", ")}
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
          >
            Nhập kho
          </Link>
        </div>
      )}

      {/* QR MODAL */}
      {selectedQR && (
        <QRModal
          isOpen={true}
          onClose={() => setSelectedQR(null)}
          url={selectedQR.url}
          title={selectedQR.title}
          subtitle={selectedQR.subtitle}
        />
      )}
    </div>
  );
}
