"use client";

import { useState } from "react";
import { X, ShieldCheck, CheckCircle2, Star, Clock } from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { BuyerReviewForm } from "./buyer-review-form";
import { SellerReviewForm } from "./seller-review-form";
import { ReviewEligibilityService } from "@/lib/services/review-eligibility-service";
import { Order, Transaction } from "@/types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  order?: Order | null;
  forcedRole?: "BUYER" | "SELLER";
  onSuccess?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  transaction,
  order,
  forcedRole,
  onSuccess,
}: ReviewModalProps) {
  const { currentContext, currentUser, reviews, submitReview } = useCommerceStore();
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentActorId = currentContext.actor_id || currentUser?.id || "guest_buyer";
  const eligibility = ReviewEligibilityService.checkEligibility({
    transaction,
    order,
    currentActorId,
    existingReviews: reviews,
  });

  const activeRole = forcedRole || eligibility.role || "BUYER";
  const targetTxId = transaction?.id || `tx-${order?.order_number || Date.now()}`;
  const targetOrderNumber = order?.order_number || transaction?.order_number;

  const handleBuyerSubmit = async (data: {
    overall_rating: number;
    accuracy_rating: number;
    timeliness_rating: number;
    communication_rating: number;
    quality_rating?: number;
    comment?: string;
  }) => {
    const sellerActorId = transaction?.organization_id || order?.organization_id || "seller_default";
    const sellerName = transaction?.seller_name || "Nhà bán hàng";

    await submitReview({
      transaction_id: targetTxId,
      order_id: order?.id,
      order_number: targetOrderNumber,
      reviewer_actor_id: currentActorId,
      reviewer_actor_type: currentContext.context_type,
      reviewer_name: currentContext.display_name || currentUser?.full_name || order?.customer_name,
      reviewee_actor_id: sellerActorId,
      reviewee_name: sellerName,
      reviewer_role: "BUYER",
      overall_rating: data.overall_rating,
      accuracy_rating: data.accuracy_rating,
      timeliness_rating: data.timeliness_rating,
      communication_rating: data.communication_rating,
      quality_rating: data.quality_rating,
      comment: data.comment,
      transaction_completed_at: order?.updated_at || transaction?.created_at,
    });

    setIsSuccess(true);
    if (onSuccess) onSuccess();
  };

  const handleSellerSubmit = async (data: {
    overall_rating: number;
    payment_rating: number;
    clarity_rating: number;
    cooperation_rating: number;
    comment?: string;
  }) => {
    const buyerActorId = transaction?.organization_id || order?.id || "buyer_default";
    const buyerName = transaction?.buyer_name || order?.customer_name || "Người mua hàng";

    await submitReview({
      transaction_id: targetTxId,
      order_id: order?.id,
      order_number: targetOrderNumber,
      reviewer_actor_id: currentActorId,
      reviewer_actor_type: currentContext.context_type,
      reviewer_name: currentContext.display_name || "Nhà bán hàng",
      reviewee_actor_id: buyerActorId,
      reviewee_name: buyerName,
      reviewer_role: "SELLER",
      overall_rating: data.overall_rating,
      payment_rating: data.payment_rating,
      clarity_rating: data.clarity_rating,
      cooperation_rating: data.cooperation_rating,
      comment: data.comment,
      transaction_completed_at: order?.updated_at || transaction?.created_at,
    });

    setIsSuccess(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {activeRole === "BUYER" ? "Đánh Giá Người Bán" : "Đánh Giá Người Mua"}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Đánh giá xác thực giao dịch thương mại
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
        <div className="p-5 sm:p-6 max-h-[85vh] overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Cảm ơn bạn đã gửi đánh giá!
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Đánh giá của bạn đã được ghi nhận. Hệ thống Double-Blind sẽ công bố khi cả hai bên đánh giá hoặc khi kết thúc thời hạn 14 ngày.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-all"
              >
                Đóng
              </button>
            </div>
          ) : !eligibility.eligible && eligibility.hasReviewed ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Bạn đã gửi đánh giá cho giao dịch này
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Đánh giá đang ở trạng thái bảo vệ hai chiều và sẽ hiển thị công khai khi đối tác hoàn thành đánh giá hoặc khi hết hạn 14 ngày.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          ) : activeRole === "BUYER" ? (
            <BuyerReviewForm
              transactionId={targetTxId}
              orderNumber={targetOrderNumber}
              sellerName={transaction?.seller_name}
              onSubmit={handleBuyerSubmit}
              onCancel={onClose}
            />
          ) : (
            <SellerReviewForm
              transactionId={targetTxId}
              orderNumber={targetOrderNumber}
              buyerName={transaction?.buyer_name || order?.customer_name}
              onSubmit={handleSellerSubmit}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
