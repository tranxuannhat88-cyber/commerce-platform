"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Shield, Star, CheckCircle, Info } from "lucide-react";

interface SellerTrustSummaryProps {
  sellerDisplayName: string;
  sellerSlug?: string;
  trustScore?: number | null;
  completionRate?: number | null;
  onTimeRate?: number | null;
  completedTransactions?: number;
  ratingAverage?: number | null;
  ratingCount?: number;
  isVerified?: boolean;
  memberSince?: string;
}

export function SellerTrustSummary({
  sellerDisplayName,
  sellerSlug,
  trustScore,
  completionRate,
  onTimeRate,
  completedTransactions = 0,
  ratingAverage,
  ratingCount = 0,
  isVerified = false,
  memberSince,
}: SellerTrustSummaryProps) {
  const hasRealTransactions = completedTransactions > 0;
  const hasTrustScore = trustScore !== null && trustScore !== undefined && hasRealTransactions;
  const hasCompletionRate = completionRate !== null && completionRate !== undefined && hasRealTransactions;
  const hasOnTimeRate = onTimeRate !== null && onTimeRate !== undefined && hasRealTransactions;
  const hasRating = ratingAverage !== null && ratingAverage !== undefined && ratingCount > 0;

  // Active Metric Cards to display (Dynamic, zero fabricated cards!)
  const hasAnyMetricCards = hasTrustScore || hasRealTransactions || hasCompletionRate || hasOnTimeRate || hasRating;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Về Người Bán & Độ Tin Cậy
          </h3>
        </div>
        {sellerSlug && (
          <Link
            href={`/seller/${sellerSlug}`}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Xem hồ sơ người bán</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {hasRealTransactions && hasAnyMetricCards ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {/* Metric 1: Completed Transactions */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {completedTransactions}
            </p>
            <p className="text-[10px] text-neutral-500 font-semibold">Giao Dịch Hoàn Thành</p>
          </div>

          {/* Metric 2: Trust Score (Only if calculated) */}
          {hasTrustScore && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
              <div className="flex items-center justify-center gap-1 text-blue-600 font-black text-base sm:text-lg">
                <span>{trustScore}</span>
                <span className="text-[10px] text-neutral-400 font-normal">/100</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-semibold">Điểm Uy Tín</p>
            </div>
          )}

          {/* Metric 3: Completion Rate (Only if available) */}
          {hasCompletionRate && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
              <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100">
                {completionRate}%
              </p>
              <p className="text-[10px] text-neutral-500 font-semibold">Tỷ Lệ Thành Công</p>
            </div>
          )}

          {/* Metric 4: On-time Delivery (Only if available) */}
          {hasOnTimeRate && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
              <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100">
                {onTimeRate}%
              </p>
              <p className="text-[10px] text-neutral-500 font-semibold">Giao Đúng Hẹn</p>
            </div>
          )}

          {/* Metric 5: Aggregate Rating (Only if ratingCount > 0) */}
          {hasRating && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-base sm:text-lg">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{ratingAverage?.toFixed(1)}</span>
                <span className="text-[10px] text-neutral-400 font-normal">({ratingCount})</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-semibold">Đánh Giá</p>
            </div>
          )}
        </div>
      ) : (
        /* Clean Zero State for Fresh Sellers */
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Chưa có đủ dữ liệu giao dịch để tính các chỉ số uy tín.</span>
          </div>
          <p className="text-[11px] text-neutral-400 pl-6">
            Các chỉ số đánh giá và điểm uy tín sẽ được cập nhật tự động khi người bán hoàn tất giao dịch trên nền tảng.
          </p>
        </div>
      )}

      {/* Footer Info Row */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
        <span>
          Người bán: <strong className="text-neutral-700 dark:text-neutral-300">{sellerDisplayName}</strong>
          {isVerified && <span className="text-emerald-600 font-bold ml-1">✓ Đã xác minh</span>}
        </span>
        {memberSince && <span>Tham gia từ: {memberSince}</span>}
      </div>
    </div>
  );
}
