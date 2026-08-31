"use client";

import { useState } from "react";
import { Star, ShieldCheck, MessageSquare, Flag, CornerDownRight, CheckCircle2 } from "lucide-react";
import { TransactionReview, ReviewResponse } from "@/types";
import { formatDate } from "@/lib/utils";

interface VerifiedReviewCardProps {
  review: TransactionReview;
  canRespond?: boolean;
  onRespond?: (reviewId: string, comment: string) => Promise<any> | any;
  onReport?: (reviewId: string) => void;
}

export function VerifiedReviewCard({
  review,
  canRespond = false,
  onRespond,
  onReport,
}: VerifiedReviewCardProps) {
  const [showRespondInput, setShowRespondInput] = useState(false);
  const [responseComment, setResponseComment] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Mask personal buyer names if necessary
  const formatReviewerName = (name?: string, actorType?: string) => {
    if (!name) return "Khách hàng xác minh";
    if (actorType === "ORGANIZATION") return name;
    // Mask name like Tran *** Nhat
    const parts = name.trim().split(" ");
    if (parts.length > 2) {
      return `${parts[0]} *** ${parts[parts.length - 1]}`;
    }
    return name;
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseComment.trim() || !onRespond) return;
    setIsSubmittingResponse(true);
    try {
      await onRespond(review.id, responseComment.trim());
      setShowRespondInput(false);
      setResponseComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3.5 hover:border-emerald-500/40 transition-all">
      {/* Header: Reviewer & Verified Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {review.reviewer_name?.slice(0, 1).toUpperCase() || "K"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {formatReviewerName(review.reviewer_name, review.reviewer_actor_type)}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/50 dark:border-emerald-900/50">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Đánh giá đã xác minh</span>
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {formatDate(review.submitted_at || review.created_at)}
              {review.order_number && ` • Đơn hàng #${review.order_number}`}
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= review.overall_rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-200 dark:text-neutral-800"
              }`}
            />
          ))}
          <span className="text-xs font-black text-amber-500 ml-1.5">
            {review.overall_rating}.0
          </span>
        </div>
      </div>

      {/* Criteria Badges */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {review.accuracy_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Đúng mô tả: <strong className="text-neutral-900 dark:text-neutral-200">{review.accuracy_rating}★</strong>
          </span>
        )}
        {review.timeliness_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Đúng hẹn: <strong className="text-neutral-900 dark:text-neutral-200">{review.timeliness_rating}★</strong>
          </span>
        )}
        {review.communication_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Giao tiếp: <strong className="text-neutral-900 dark:text-neutral-200">{review.communication_rating}★</strong>
          </span>
        )}
        {review.quality_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Chất lượng: <strong className="text-neutral-900 dark:text-neutral-200">{review.quality_rating}★</strong>
          </span>
        )}
        {review.payment_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Thanh toán đúng hạn: <strong className="text-neutral-900 dark:text-neutral-200">{review.payment_rating}★</strong>
          </span>
        )}
        {review.clarity_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Yêu cầu rõ ràng: <strong className="text-neutral-900 dark:text-neutral-200">{review.clarity_rating}★</strong>
          </span>
        )}
        {review.cooperation_rating && (
          <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            Phối hợp: <strong className="text-neutral-900 dark:text-neutral-200">{review.cooperation_rating}★</strong>
          </span>
        )}
      </div>

      {/* Review Comment */}
      {review.comment && (
        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50/50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
          "{review.comment}"
        </p>
      )}

      {/* Official Response */}
      {review.response && (
        <div className="ml-4 sm:ml-6 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 dark:text-blue-300">
            <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Phản hồi từ {review.response.responder_name || "Đối tác"}:</span>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-200 pl-5 leading-relaxed">
            {review.response.comment}
          </p>
        </div>
      )}

      {/* Footer Controls: Respond & Report */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60 text-xs">
        <div>
          {canRespond && !review.response && !showRespondInput && (
            <button
              onClick={() => setShowRespondInput(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Phản hồi đánh giá</span>
            </button>
          )}
        </div>

        {onReport && (
          <button
            onClick={() => onReport(review.id)}
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-500 cursor-pointer transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo cáo</span>
          </button>
        )}
      </div>

      {/* Inline Respond Form */}
      {showRespondInput && (
        <form onSubmit={handleSendResponse} className="pt-2 space-y-2 animate-in fade-in">
          <textarea
            rows={2}
            value={responseComment}
            onChange={(e) => setResponseComment(e.target.value)}
            placeholder="Nhập phản hồi chính thức cho khách hàng..."
            className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRespondInput(false)}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingResponse || !responseComment.trim()}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg cursor-pointer transition-all shadow-xs"
            >
              {isSubmittingResponse ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
