"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Store, FileText, Compass, ArrowRight, X } from "lucide-react";

interface StartRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSell?: () => void;
  onSelectBuy?: () => void;
  onSelectExplore?: () => void;
}

export function StartRoleModal({
  isOpen,
  onClose,
  onSelectSell,
  onSelectBuy,
  onSelectExplore,
}: StartRoleModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSell = () => {
    onClose();
    if (onSelectSell) onSelectSell();
    else router.push("/onboarding");
  };

  const handleBuy = () => {
    onClose();
    if (onSelectBuy) onSelectBuy();
    else router.push("/buy/requests");
  };

  const handleExplore = () => {
    onClose();
    if (onSelectExplore) onSelectExplore();
    else router.push("/store");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Bạn Muốn Bắt Đầu Thế Nào?
          </h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Bạn có thể tự do chuyển đổi giữa mua, bán và quản lý giao dịch bất kỳ lúc nào.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Bán Hàng */}
          <div
            onClick={handleSell}
            className="p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 hover:border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-left space-y-3 cursor-pointer transition-all hover:shadow-lg active:scale-98 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">BÁN HÀNG</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Tạo cửa hàng, đăng sản phẩm và nhận đơn hàng VietQR.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
              Bắt đầu bán <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Mua / Tìm NCC */}
          <div
            onClick={handleBuy}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-600 bg-neutral-50 dark:bg-neutral-800/40 text-left space-y-3 cursor-pointer transition-all hover:shadow-lg active:scale-98 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">TÌM NHÀ CUNG CẤP</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Tạo yêu cầu RFQ và nhận báo giá từ nhiều nhà cung cấp.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              Tạo yêu cầu <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Khám phá */}
          <div
            onClick={handleExplore}
            className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-purple-600 bg-neutral-50 dark:bg-neutral-800/40 text-left space-y-3 cursor-pointer transition-all hover:shadow-lg active:scale-98 group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">KHÁM PHÁ</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Xem tổng quan nền tảng và các tính năng thương mại.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
              Xem ngay <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
