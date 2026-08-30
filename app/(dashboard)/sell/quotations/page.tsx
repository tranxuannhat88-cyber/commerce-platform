"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
  Search,
  KeyRound,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDateTime } from "@/lib/utils";
import { Quotation, QuotationStatus } from "@/types";

export default function SellerQuotationsPage() {
  const { quotations, claimGuestQuotations, organization } = useCommerceStore();
  const [claimTokenInput, setClaimTokenInput] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sellerQuotes = quotations.filter((q) => {
    const isSeller = q.seller_organization_id === organization.id || q.guest_claim_token !== undefined;
    const matchSearch =
      q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.request_title && q.request_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return isSeller && matchSearch;
  });

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimTokenInput.trim()) return;
    claimGuestQuotations(claimTokenInput.trim());
    setClaimSuccess(true);
    setClaimTokenInput("");
    setTimeout(() => setClaimSuccess(false), 3000);
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case "SUBMITTED":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Đã gửi</span>;
      case "VIEWED":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">👁️ Buyer đã xem</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 text-white">✓ Trúng thầu (Đã tạo Đơn)</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-200 text-neutral-600">Không được chọn</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          Báo Giá Đã Gửi (Seller Quotation Workspace)
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Theo dõi trạng thái các báo giá bạn đã gửi cho khách hàng & đối tác
        </p>
      </div>

      {/* Claim Guest Quotations Growth Loop Widget */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
              Bạn từng gửi báo giá vãng lai khi chưa có tài khoản?
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              Nhập mã Claim Token để đồng bộ báo giá đó vào Doanh nghiệp của bạn ngay lập tức!
            </p>
          </div>
        </div>

        <form onSubmit={handleClaim} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nhập mã claim token..."
            value={claimTokenInput}
            onChange={(e) => setClaimTokenInput(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap"
          >
            Đồng bộ
          </button>
        </form>
      </div>

      {claimSuccess && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
          ✓ Đã gắn kết báo giá vào Workspace thành công!
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Tìm theo mã báo giá, tiêu đề..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
        />
      </div>

      {/* Quotations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sellerQuotes.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs">
            Bạn chưa gửi báo giá nào
          </div>
        ) : (
          sellerQuotes.map((q) => (
            <div
              key={q.id}
              className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {q.quotation_number}
                </span>
                {getStatusBadge(q.status)}
              </div>

              <div>
                <p className="text-xs text-neutral-400">Yêu cầu:</p>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                  {q.request_title || "Yêu cầu gia công CNC / Dịch vụ"}
                </h4>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500">Giá trị báo giá:</span>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400">
                    {formatVND(q.total)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 text-[11px]">Tiến độ giao:</span>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {q.lead_time || "5-7 ngày"}
                  </p>
                </div>
              </div>

              {q.status === "ACCEPTED" && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                  <span>🎉 Chúc mừng! Đơn hàng đã được tạo</span>
                  <Link href="/sell/orders" className="text-blue-600 hover:underline">
                    Xem Đơn Bán →
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
