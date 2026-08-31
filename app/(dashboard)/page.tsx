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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dual-Sided Commerce Platform</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {organization.name || "Không Gian Thương Mại Cá Nhân"}
            </h2>
            <p className="text-sm text-neutral-300">
              Mô hình: <span className="font-semibold text-white">CREATE AN OFFER</span> hoặc <span className="font-semibold text-white">CREATE A REQUEST</span> → Gửi link → Giao dịch & Sổ cái tài chính.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {store.slug ? (
              <>
                <button
                  onClick={() => setSelectedQR({ url: storeUrl, title: "QR Cửa Hàng", subtitle: store.store_name })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition-all border border-white/10 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>QR Cửa Hàng</span>
                </button>
                <CopyButton text={storeUrl} label="Copy Link Cửa Hàng" className="py-2.5 px-4 text-xs font-semibold bg-white text-neutral-900 border-none hover:bg-neutral-100" />
              </>
            ) : (
              <Link
                href="/store"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>+ Tạo Cửa Hàng Đầu Tiên</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background lights */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh số */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Tổng Doanh Số (Sales)</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            {formatVND(financials.totalSales)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {financials.ordersCount} đơn hàng ghi nhận
          </p>
        </div>

        {/* Tiền đã thu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Tiền Đã Thu (Cash)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatVND(financials.totalCashReceived)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Còn phải thu: <span className="font-semibold text-amber-600">{formatVND(financials.totalReceivable)}</span>
          </p>
        </div>

        {/* Lãi gộp */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Lãi Gộp (Gross Profit)</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3 text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatVND(financials.grossProfit)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Giá vốn (COGS): {formatVND(financials.totalCOGS)}
          </p>
        </div>

        {/* Lợi nhuận ước tính */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Lợi Nhuận Ước Tính</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            {formatVND(financials.estimatedNetProfit)}
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Chi phí vận hành: {formatVND(financials.totalOperatingExpenses)}
          </p>
        </div>
      </div>

      {/* DUAL WORKSPACE HUBS (SUPPLY SIDE & DEMAND SIDE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HUB 1: SUPPLY SIDE (BÁN HÀNG & OFFERS) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                🏷️
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Kênh Bán Hàng (Supply Side)
                </h3>
                <p className="text-xs text-neutral-500">Tạo Offer → Gửi link → Nhận đơn</p>
              </div>
            </div>
            <Link
              href="/sell/offers"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
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
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {offer.name}
                        </p>
                        <p className="text-xs text-blue-600 font-semibold mt-0.5">
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
                        className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/50 transition-colors"
                        title="Mã QR Offer"
                      >
                        <QrCode className="w-4 h-4" />
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
              <Link href="/sell/orders" className="text-xs text-blue-600 hover:underline">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
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
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                🛒
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
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
                        className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/50 transition-colors"
                        title="Mã QR Request"
                      >
                        <QrCode className="w-4 h-4" />
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
                      className="text-xs font-semibold text-blue-600 hover:underline"
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
