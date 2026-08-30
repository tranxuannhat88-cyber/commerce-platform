"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  KeyRound,
  ArrowRight,
  Send,
  Building,
  ShieldCheck,
} from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import confetti from "canvas-confetti";

function QuoteSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestNumber = params?.request_number as string;
  const quoteNum = searchParams.get("quoteNum") || "QT260829-00914";
  const claimToken = searchParams.get("token") || "token-claim-demo";

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans flex items-center justify-center p-4 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
            {quoteNum}
          </span>
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
            Gửi Báo Giá Thành Công!
          </h2>
          <p className="text-xs text-neutral-500">
            Bảng chào giá của bạn đã được gửi trực tiếp tới khách hàng cho yêu cầu{" "}
            <strong className="text-neutral-800 dark:text-neutral-200">{requestNumber}</strong>.
          </p>
        </div>

        {/* Growth Loop: Claim Token & Account Linking */}
        <div className="p-4 rounded-2xl bg-linear-to-b from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
              Quản lý báo giá & Nhận thông báo Realtime
            </span>
          </div>

          <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
            Mã định danh báo giá của bạn (Claim Token):
          </p>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
            <span className="truncate max-w-[220px]">{claimToken}</span>
            <CopyButton text={claimToken} label="Copy" className="text-[10px] py-1" />
          </div>

          <p className="text-[10px] text-neutral-500">
            Tạo tài khoản hoặc đăng nhập vào Workspace để nhận thông báo ngay khi Khách hàng mở xem hoặc duyệt đơn!
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href="/sell/quotations"
            className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <span>Vào Workspace Quản Lý Báo Giá</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={`/r/${requestNumber}`}
            className="block text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 py-1"
          >
            ← Quay lại trang Yêu cầu
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QuoteSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <QuoteSuccessContent />
    </Suspense>
  );
}
