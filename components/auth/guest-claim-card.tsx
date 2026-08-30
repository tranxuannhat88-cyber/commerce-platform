"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { UnifiedAuthModal } from "./unified-auth-modal";
import { PasskeyPromptModal } from "./passkey-prompt-modal";
import { ClaimService } from "@/lib/auth/claim-service";
import { Order, Quotation } from "@/types";
import { UserIdentity } from "@/lib/auth/types";

interface GuestClaimCardProps {
  type: "ORDER" | "QUOTATION";
  order?: Order;
  quotation?: Quotation;
  initialPhone?: string;
  onClaimSuccess?: (user: UserIdentity) => void;
}

export function GuestClaimCard({
  type,
  order,
  quotation,
  initialPhone = "",
  onClaimSuccess,
}: GuestClaimCardProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [claimedUser, setClaimedUser] = useState<UserIdentity | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  const handleAuthSuccess = (user: UserIdentity, isNewUser: boolean) => {
    setClaimedUser(user);

    if (type === "ORDER" && order) {
      ClaimService.claimGuestOrder(order, user);
    } else if (type === "QUOTATION" && quotation) {
      ClaimService.claimGuestQuotation(quotation, user);
    }

    setIsClaimed(true);
    if (onClaimSuccess) onClaimSuccess(user);

    // If new user, propose passkey setup
    setTimeout(() => {
      setShowPasskeyPrompt(true);
    }, 600);
  };

  if (isClaimed) {
    return (
      <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3.5 text-emerald-800 dark:text-emerald-300 animate-in zoom-in-95">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xs">
            {type === "ORDER" ? "Đã Liên Kết Đơn Hàng Vào Tài Khoản" : "Đã Lưu Báo Giá Vào Workspace"}
          </h4>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
            Bạn có thể đăng nhập bằng số điện thoại để theo dõi bất kỳ lúc nào.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 md:p-6 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Tự Động Lưu Lịch Sử</span>
          </div>
          <h4 className="text-base font-bold">
            {type === "ORDER"
              ? "Tạo Tài Khoản Để Theo Dõi Đơn Hàng"
              : "Lưu Báo Giá & Nhận Phản Hồi Từ Khách Hàng"}
          </h4>
          <p className="text-xs text-blue-100 leading-relaxed max-w-md">
            {type === "ORDER"
              ? "Xác minh số điện thoại trong 10 giây để theo dõi lộ trình giao hàng, nhận thông báo VietQR và xem lại hóa đơn."
              : "Tạo tài khoản để theo dõi khi khách hàng duyệt báo giá và quản lý toàn bộ giao dịch."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="px-5 py-3 rounded-2xl bg-white hover:bg-neutral-100 active:scale-95 text-blue-700 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px]"
        >
          <span>TẠO TÀI KHOẢN NGAY</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Unified Auth Modal */}
      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialPhone={initialPhone || order?.customer_phone || ""}
        onSuccess={handleAuthSuccess}
        title="Lưu Giao Dịch Vào Tài Khoản"
        subtitle="Xác minh số điện thoại để liên kết đơn hàng này vào tài khoản của bạn"
      />

      {/* Passkey Setup Prompt */}
      {claimedUser && (
        <PasskeyPromptModal
          isOpen={showPasskeyPrompt}
          onClose={() => setShowPasskeyPrompt(false)}
          user={claimedUser}
        />
      )}
    </>
  );
}
