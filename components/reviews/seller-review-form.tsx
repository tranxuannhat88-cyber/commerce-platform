"use client";

import { useState } from "react";
import { Star, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface SellerReviewFormProps {
  transactionId: string;
  orderNumber?: string;
  buyerName?: string;
  onSubmit: (data: {
    overall_rating: number;
    payment_rating: number;
    clarity_rating: number;
    cooperation_rating: number;
    comment?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function SellerReviewForm({
  transactionId,
  orderNumber,
  buyerName = "Người mua hàng",
  onSubmit,
  onCancel,
}: SellerReviewFormProps) {
  const [overall, setOverall] = useState<number>(5);
  const [payment, setPayment] = useState<number>(5);
  const [clarity, setClarity] = useState<number>(5);
  const [cooperation, setCooperation] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const renderStars = (value: number, onChange: (v: number) => void, label: string) => {
    return (
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
            {label} <span className="text-red-500">*</span>
          </p>
          <p className="text-[11px] font-semibold text-amber-500">{value} / 5 sao</p>
        </div>
        <div className="flex items-center gap-1 shrink-0" role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-all focus:outline-hidden cursor-pointer"
              aria-label={`${star} sao`}
            >
              <Star
                className={`w-6 h-6 transition-all ${
                  star <= value
                    ? "fill-amber-400 text-amber-400 scale-105"
                    : "text-neutral-300 dark:text-neutral-600 hover:text-amber-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overall || overall < 1 || overall > 5) {
      setErrorMsg("Vui lòng chọn điểm đánh giá tổng thể.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        overall_rating: overall,
        payment_rating: payment,
        clarity_rating: clarity,
        cooperation_rating: cooperation,
        comment: comment.trim() || undefined,
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header Info */}
      <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-blue-950 dark:text-blue-200">
            Đánh Giá Người Mua: {buyerName}
          </p>
          <p className="text-blue-700 dark:text-blue-400 text-[11px] mt-0.5">
            Đánh giá gắn với đơn hàng {orderNumber ? `DH #${orderNumber}` : `TX #${transactionId.slice(0, 10)}`}.
            Bảo vệ hai chiều (Double-Blind) chống trả đũa.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Star Criteria: 1 item per row */}
      <div className="space-y-2.5 pt-1">
        {renderStars(overall, setOverall, "Trải nghiệm tổng thể")}
        {renderStars(payment, setPayment, "Thanh toán đúng hạn")}
        {renderStars(clarity, setClarity, "Yêu cầu rõ ràng")}
        {renderStars(cooperation, setCooperation, "Hợp tác & phối hợp")}
      </div>

      {/* Comment */}
      <div className="space-y-1 pt-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-neutral-700 dark:text-neutral-300">
            Nhận xét về đối tác (Tùy chọn)
          </label>
          <span className="text-[11px] text-neutral-400">{comment.length}/1000</span>
        </div>
        <textarea
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ về độ tin cậy thanh toán và mức độ phối hợp của người mua..."
          className="w-full p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
          >
            Để sau
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span>Đang gửi...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Gửi Đánh Giá Người Mua</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
