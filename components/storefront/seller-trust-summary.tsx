"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Award, CheckCircle, Clock, ArrowRight, Shield } from "lucide-react";

interface SellerTrustSummaryProps {
  sellerDisplayName: string;
  sellerSlug: string;
  trustScore: number;
  completionRate: number;
  onTimeRate: number;
  completedTransactions: number;
  memberSince?: string;
}

export function SellerTrustSummary({
  sellerDisplayName,
  sellerSlug,
  trustScore,
  completionRate,
  onTimeRate,
  completedTransactions,
  memberSince = "Tháng 1, 2026",
}: SellerTrustSummaryProps) {
  return (
    <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Về Người Bán & Độ Tin Cậy
          </h3>
        </div>
        <Link
          href={`/seller/${sellerSlug}`}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <span>Xem Hồ Sơ</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {/* Metric 1: Trust Score */}
        <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
          <div className="flex items-center justify-center gap-1 text-blue-600 font-black text-base sm:text-lg">
            <span>{trustScore}</span>
            <span className="text-[10px] text-neutral-400 font-normal">/100</span>
          </div>
          <p className="text-[10px] text-neutral-500 font-semibold">Điểm Uy Tín</p>
        </div>

        {/* Metric 2: Completed Transactions */}
        <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
          <p className="text-base sm:text-lg font-black text-emerald-600">
            {completedTransactions}
          </p>
          <p className="text-[10px] text-neutral-500 font-semibold">Đơn Hoàn Thành</p>
        </div>

        {/* Metric 3: Completion Rate */}
        <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
          <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100">
            {completionRate}%
          </p>
          <p className="text-[10px] text-neutral-500 font-semibold">Tỷ Lệ Thành Công</p>
        </div>

        {/* Metric 4: On-time Delivery */}
        <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
          <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100">
            {onTimeRate}%
          </p>
          <p className="text-[10px] text-neutral-500 font-semibold">Giao Đúng Hẹn</p>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-200/60 dark:border-neutral-800">
        <span>Người bán: <strong className="text-neutral-700 dark:text-neutral-300">{sellerDisplayName}</strong></span>
        <span>Gia nhập từ: {memberSince}</span>
      </div>
    </div>
  );
}
