"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Store,
  FileQuestion,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { CreateOrgModal } from "@/components/dashboard/create-org-modal";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, currentContext } = useCommerceStore();
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans flex items-center justify-center p-4 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-xl w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6 animate-in fade-in">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Chào mừng {currentUser?.full_name || "bạn"}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Tài khoản và không gian <strong>CÁ NHÂN</strong> của bạn đã sẵn sàng. Bạn có thể bắt đầu bán hàng, tạo yêu cầu mua sắm hoặc khám phá ngay.
          </p>
        </div>

        {/* 3 Core Quick Action Cards */}
        <div className="space-y-3">
          {/* Action 1: Bắt đầu bán (Tạo cửa hàng) */}
          <Link
            href="/store"
            className="p-4 rounded-2xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-100 group-hover:text-blue-700 transition-colors">
                  Bắt Đầu Bán Hàng (Tạo Cửa Hàng)
                </h3>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300">
                  Tạo trang cửa hàng cá nhân, thêm sản phẩm và gửi link Offer
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Action 2: Tạo yêu cầu mua (RFQ) */}
          <Link
            href="/buy/requests?create=true"
            className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-700 transition-colors">
                  Tạo Yêu Cầu Mua Sắm (RFQ)
                </h3>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300">
                  Phát hành yêu cầu báo giá để nhận chào giá cạnh tranh từ nhà cung cấp
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Action 3: Khám phá Dashboard */}
          <Link
            href="/"
            className="p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 transition-colors">
                  Khám Phá Bảng Điều Khiển
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Xem tổng quan thu chi, xác thực Merkle và quản lý giao dịch
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Optional Org creation footer */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Cần thêm nhân viên & đội nhóm?</span>
          <button
            type="button"
            onClick={() => setShowCreateOrg(true)}
            className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>+ Tạo Tổ Chức</span>
          </button>
        </div>
      </div>

      <CreateOrgModal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSuccess={() => {
          setShowCreateOrg(false);
          router.push("/");
        }}
      />
    </div>
  );
}
