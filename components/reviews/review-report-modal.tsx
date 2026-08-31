"use client";

import { useState } from "react";
import { X, Flag, AlertCircle, CheckCircle2 } from "lucide-react";
import { ReviewReportReason } from "@/types";

interface ReviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onSubmit: (reason: ReviewReportReason, description?: string) => Promise<void>;
}

const REPORT_REASONS: { key: ReviewReportReason; label: string; desc: string }[] = [
  { key: "SPAM", label: "Spam / Quảng cáo rác", desc: "Nội dung quảng bá sản phẩm khác hoặc lặp lại vô nghĩa." },
  { key: "OFFENSIVE_CONTENT", label: "Nội dung xúc phạm / Thô tục", desc: "Sử dụng từ ngữ đe dọa, xúc phạm hoặc phân biệt đối xử." },
  { key: "NOT_TRANSACTION_RELATED", label: "Không liên quan giao dịch", desc: "Đánh giá nội dung không phát sinh từ việc mua bán." },
  { key: "PERSONAL_INFO_LEAK", label: "Tiết lộ thông tin cá nhân", desc: "Chứa số điện thoại, địa chỉ nhà riêng hoặc số tài khoản nhạy cảm." },
  { key: "FRAUD", label: "Gian lận / Trả thù", desc: "Cố tình đánh giá sai sự thật hoặc gian dối." },
  { key: "OTHER", label: "Lý do khác", desc: "Vi phạm các quy chuẩn cộng đồng khác." },
];

export function ReviewReportModal({
  isOpen,
  onClose,
  reviewId,
  onSubmit,
}: ReviewReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReviewReportReason>("SPAM");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, description.trim() || undefined);
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="w-4 h-4" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Báo Cáo Đánh Giá Vi Phạm
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Đã tiếp nhận báo cáo của bạn
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Đội ngũ kiểm duyệt sẽ xem xét đánh giá này theo đúng quy chuẩn cộng đồng.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-all"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Chọn lý do báo cáo:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.key}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        selectedReason === r.key
                          ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900"
                          : "bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/70 dark:border-neutral-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r.key}
                        checked={selectedReason === r.key}
                        onChange={() => setSelectedReason(r.key)}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">{r.label}</p>
                        <p className="text-[11px] text-neutral-500">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Mô tả chi tiết (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cung cấp thêm chi tiết để giúp kiểm duyệt viên xử lý nhanh hơn..."
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
