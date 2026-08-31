"use client";

import { useState } from "react";
import { Star, ShieldCheck, Check, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface BuyerReviewFormProps {
  transactionId: string;
  orderNumber?: string;
  sellerName?: string;
  onSubmit: (data: {
    overall_rating: number;
    accuracy_rating: number;
    timeliness_rating: number;
    communication_rating: number;
    quality_rating?: number;
    comment?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function BuyerReviewForm({
  transactionId,
  orderNumber,
  sellerName = "Người bán",
  onSubmit,
  onCancel,
}: BuyerReviewFormProps) {
  const [overall, setOverall] = useState<number>(5);
  const [accuracy, setAccuracy] = useState<number>(5);
  const [timeliness, setTimeliness] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [quality, setQuality] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const renderStars = (
    value: number,
    onChange: (v: number) => void,
    label: string,
    required: boolean = true
  ) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          <span className="font-bold text-amber-500 text-[11px]">{value} / 5 sao</span>
        </div>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all focus:outline-hidden cursor-pointer"
              aria-label={`${star} sao`}
            >
              <Star
                className={`w-6 h-6 transition-all ${
                  star <= value
                    ? "fill-amber-400 text-amber-400 scale-105"
                    : "text-neutral-300 dark:text-neutral-700 hover:text-amber-300"
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
        accuracy_rating: accuracy,
        timeliness_rating: timeliness,
        communication_rating: communication,
        quality_rating: quality,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header Info */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-emerald-950 dark:text-emerald-200">
            Đánh Giá Người Bán: {sellerName}
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
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

      {/* Star Criteria */}
      <div className="space-y-4 pt-1">
        {renderStars(overall, setOverall, "Trải nghiệm tổng thể", true)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {renderStars(accuracy, setAccuracy, "Sản phẩm đúng mô tả", true)}
          {renderStars(timeliness, setTimeliness, "Giao hàng đúng hẹn", true)}
          {renderStars(communication, setCommunication, "Giao tiếp & hỗ trợ", true)}
          {renderStars(quality, setQuality, "Chất lượng sản phẩm / dịch vụ", false)}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-1 pt-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-neutral-700 dark:text-neutral-300">
            Nhận xét chi tiết (Tùy chọn)
          </label>
          <span className="text-[11px] text-neutral-400">{comment.length}/1000</span>
        </div>
        <textarea
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm mua hàng thực tế của bạn để xây dựng cộng đồng thương mại tin cậy..."
          className="w-full p-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span>Đang gửi...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Gửi Đánh Giá Đã Xác Minh</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
