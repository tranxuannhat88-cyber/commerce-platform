"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Eye,
  Building,
  Clock,
  ShieldCheck,
  Truck,
  DollarSign,
  ArrowRight,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDate, formatDateTime } from "@/lib/utils";
import { Quotation, QuotationStatus } from "@/types";
import confetti from "canvas-confetti";

export default function BuyerQuotationsPage() {
  const { quotations, requests, acceptQuotation, markQuotationViewed } = useCommerceStore();
  const [selectedRequestId, setSelectedRequestId] = useState<string>("ALL");
  const [activeQuote, setActiveQuote] = useState<Quotation | null>(null);

  const filteredQuotes = quotations.filter((q) => {
    return selectedRequestId === "ALL" || q.request_id === selectedRequestId;
  });

  const handleOpenQuoteDetails = (quote: Quotation) => {
    setActiveQuote(quote);
    if (quote.status === "SUBMITTED") {
      markQuotationViewed(quote.id);
    }
  };

  const handleAcceptQuote = (quoteId: string) => {
    acceptQuotation(quoteId);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    // update local active quote view
    setActiveQuote((prev) => (prev ? { ...prev, status: "ACCEPTED" } : null));
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Báo giá mới</span>;
      case "VIEWED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Đã xem</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-600 text-white">✓ Đã chấp nhận (Đã tạo Đơn)</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 text-neutral-600">Không chọn</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          So Sánh & Chấp Nhận Báo Giá (Quotations)
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Xem danh sách các bảng chào giá từ các nhà cung cấp / xưởng và chốt nhà thầu phù hợp nhất
        </p>
      </div>

      {/* Filter by Request */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-neutral-500 shrink-0">Lọc theo Yêu cầu:</span>
        <button
          onClick={() => setSelectedRequestId("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedRequestId === "ALL"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          }`}
        >
          Tất cả yêu cầu ({quotations.length})
        </button>
        {requests.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRequestId(r.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRequestId === r.id
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {r.request_number}: {r.title.slice(0, 25)}...
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Báo Giá</th>
                <th className="py-3.5 px-4">Nhà Cung Cấp / Xưởng</th>
                <th className="py-3.5 px-4">Tổng Giá (VNĐ)</th>
                <th className="py-3.5 px-4">Tiến Độ / Lead Time</th>
                <th className="py-3.5 px-4">Điều Khoản Thanh Toán</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-400 text-xs">
                    Chưa nhận được báo giá nào cho yêu cầu này
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                      quote.status === "ACCEPTED" ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {quote.quotation_number}
                      </span>
                      <div className="text-[10px] text-neutral-400">
                        Gửi lúc: {formatDateTime(quote.submitted_at)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>{quote.guest_company_name || quote.guest_seller_name || "Nhà Cung Cấp 2K"}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        SĐT: {quote.guest_phone || "0988.123.456"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {formatVND(quote.total)}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      {quote.lead_time || "Thỏa thuận"}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 text-[11px]">
                      {quote.payment_terms || "Thanh toán khi nhận"}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(quote.status)}</td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenQuoteDetails(quote)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200"
                      >
                        Chi tiết
                      </button>

                      {quote.status !== "ACCEPTED" && (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        >
                          Chấp nhận
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUOTATION DETAILS MODAL */}
      {activeQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Báo giá {activeQuote.quotation_number}
                  </h3>
                  {getStatusBadge(activeQuote.status)}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Đơn vị báo giá: {activeQuote.guest_company_name || activeQuote.guest_seller_name || "Nhà Cung Cấp 2K"}
                </p>
              </div>
              <button
                onClick={() => setActiveQuote(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Supplier & Terms Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700 text-xs">
              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Thông tin thương mại:
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Thời gian giao hàng (Lead time): <strong className="text-neutral-900 dark:text-neutral-100">{activeQuote.lead_time || "5-7 ngày"}</strong>
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Điều khoản thanh toán: <strong className="text-neutral-900 dark:text-neutral-100">{activeQuote.payment_terms}</strong>
                </p>
              </div>

              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Bảo hành & Giao hàng:
                </p>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Bảo hành: <strong className="text-neutral-900 dark:text-neutral-100">{activeQuote.warranty || "Theo tiêu chuẩn NSX"}</strong>
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                  Hiệu lực báo giá: <strong className="text-neutral-900 dark:text-neutral-100">{activeQuote.valid_until ? formatDate(activeQuote.valid_until) : "15 ngày"}</strong>
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Bảng phân tích đơn giá (Line items)
              </h4>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                {activeQuote.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.item_name}</p>
                      {item.specification && (
                        <p className="text-[11px] text-neutral-500">Quy cách: {item.specification}</p>
                      )}
                      <p className="text-[11px] text-neutral-400">
                        {formatVND(item.unit_price)} × {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatVND(item.total_price)}
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Tạm tính:</span>
                    <span>{formatVND(activeQuote.subtotal)}</span>
                  </div>
                  {activeQuote.tax > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Thuế VAT:</span>
                      <span>{formatVND(activeQuote.tax)}</span>
                    </div>
                  )}
                  {activeQuote.shipping_fee > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Vận chuyển:</span>
                      <span>{formatVND(activeQuote.shipping_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span>Tổng cộng:</span>
                    <span className="text-emerald-600">{formatVND(activeQuote.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accept Quote Button */}
            {activeQuote.status !== "ACCEPTED" && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Bạn đã sẵn sàng chốt nhà cung cấp này?
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Hệ thống sẽ tự động tạo Đơn hàng (Order) và gửi thông báo cho Seller.
                  </p>
                </div>

                <button
                  onClick={() => handleAcceptQuote(activeQuote.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
                >
                  ✓ Chấp Nhận & Tạo Đơn Hàng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
