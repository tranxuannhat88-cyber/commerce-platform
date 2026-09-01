"use client";

import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, ArrowRight, PackageCheck, Star, Sparkles } from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { ClaimableGuestSummary } from "@/lib/services/guest-claim-service";
import { formatVND, formatDate } from "@/lib/utils";

interface GuestClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimSummary: ClaimableGuestSummary;
  verifiedPhone: string;
  onSuccess?: () => void;
}

export function GuestClaimModal({
  isOpen,
  onClose,
  claimSummary,
  verifiedPhone,
  onSuccess,
}: GuestClaimModalProps) {
  const { currentContext, claimGuestHistory } = useCommerceStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClaim = async () => {
    setIsClaiming(true);
    try {
      await claimGuestHistory(currentContext.actor_id, verifiedPhone);
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error claiming history:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Liên Kết Lịch Sử Giao Dịch
              </h3>
              <p className="text-[11px] text-neutral-500">
                Đồng bộ đơn hàng của SĐT {verifiedPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Liên kết lịch sử thành công!
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Tất cả đơn hàng và đánh giá trước đây của bạn đã được gắn kết an toàn vào tài khoản cá nhân.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-md cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Hệ thống tìm thấy <strong>{claimSummary.total_orders_count} đơn hàng</strong> bạn đã giao dịch thành công trước khi đăng ký tài khoản:
              </p>

              {/* List of claimable orders */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {claimSummary.claimable_orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                          #{o.order_number}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {formatDate(o.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {formatVND(o.total_amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action CTA */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  onClick={handleConfirmClaim}
                  disabled={isClaiming}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isClaiming ? "Đang liên kết..." : "Liên Kết Với Tài Khoản"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Để sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
