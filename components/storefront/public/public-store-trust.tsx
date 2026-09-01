"use client";

import React from "react";
import { Star, ShieldCheck, CheckCircle2, Award } from "lucide-react";

interface PublicStoreTrustProps {
  trust: {
    hasRealTrustData: boolean;
    ratingAverage: number | null;
    ratingCount: number;
    completedTransactionsCount: number;
    verifiedReviewCount: number;
  };
  isVerified?: boolean;
  brandColor?: string;
}

export function PublicStoreTrust({
  trust,
  isVerified = false,
  brandColor = "#2563eb",
}: PublicStoreTrustProps) {
  // If seller is completely new with no verified records, show clean truthful notice
  if (!trust.hasRealTrustData && !isVerified) {
    return null;
  }

  return (
    <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5" style={{ color: brandColor }} />
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Chỉ Số Uy Tín & Giao Dịch
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Rating Metric */}
        {trust.ratingAverage !== null ? (
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1 text-amber-500 font-black text-base sm:text-lg">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{trust.ratingAverage}</span>
              <span className="text-xs text-neutral-400 font-normal">/5</span>
            </div>
            <p className="text-[11px] text-neutral-500 pt-0.5 font-medium">
              {trust.ratingCount} đánh giá xác thực
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-400 font-bold text-xs sm:text-sm">Chưa có đánh giá</div>
            <p className="text-[10px] text-neutral-400 pt-0.5">Từ các đơn hàng hoàn tất</p>
          </div>
        )}

        {/* Transactions Metric */}
        {trust.completedTransactionsCount > 0 ? (
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="font-black text-base sm:text-lg text-neutral-900 dark:text-neutral-100">
              {trust.completedTransactionsCount}
            </div>
            <p className="text-[11px] text-neutral-500 pt-0.5 font-medium">Giao dịch thành công</p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <div className="text-neutral-400 font-bold text-xs sm:text-sm">Người bán mới</div>
            <p className="text-[10px] text-neutral-400 pt-0.5">Sẵn sàng phục vụ đơn hàng</p>
          </div>
        )}

        {/* Verification Status */}
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
            {isVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-400">Đã định danh</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Đang hoạt động</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 pt-0.5 font-medium">Hồ sơ nền tảng Go</p>
        </div>
      </div>
    </section>
  );
}
