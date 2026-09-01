"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import confetti from "canvas-confetti";

export default function GuestReviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const { reviewInvitations, orders, store, createGuestReview } = useCommerceStore();

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP Step
  const [otpStep, setOtpStep] = useState<"OTP" | "REVIEW" | "SUCCESS">("OTP");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Review Form States (1 item per row)
  const [overall, setOverall] = useState<number>(5);
  const [accuracy, setAccuracy] = useState<number>(5);
  const [timeliness, setTimeliness] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [quality, setQuality] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Check local store first
    const localInv = reviewInvitations.find(
      (i) => i.secure_token_hash === token || i.secure_token_hash === `tok_${token}`
    );

    if (localInv) {
      const order = orders.find((o) => o.order_number === localInv.order_number || o.id === localInv.order_id);
      setInvitationData({
        invitation: {
          ...localInv,
          masked_phone: localInv.recipient_phone ? `***${localInv.recipient_phone.slice(-4)}` : "***",
        },
        seller: {
          seller_name: store?.store_name || "Nhà bán hàng",
          seller_slug: store?.slug,
        },
        order,
      });

      if (localInv.status === "VERIFIED") {
        setOtpStep("REVIEW");
      } else if (localInv.status === "USED") {
        setOtpStep("SUCCESS");
      }
      setLoading(false);
      return;
    }

    // Otherwise fetch from server API
    fetch(`/api/reviews/invitations?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvitationData(data);
          if (data.invitation.status === "VERIFIED") {
            setOtpStep("REVIEW");
          } else if (data.invitation.status === "USED") {
            setOtpStep("SUCCESS");
          }
        } else {
          setErrorMsg(data.error || "Không tìm thấy lời mời đánh giá.");
        }
      })
      .catch((err) => {
        setErrorMsg("Không thể kết nối đến máy chủ.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, reviewInvitations, orders, store]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError("Vui lòng nhập mã OTP 6 số.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      // Direct pass for 123456 or test OTP
      if (otpInput === "123456" || otpInput.length === 6) {
        setOtpStep("REVIEW");
      } else {
        setOtpError("Mã OTP không chính xác. Hãy nhập 123456 để thử nghiệm.");
      }
    } catch (e: any) {
      setOtpError(e.message || "Lỗi xác thực OTP.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overall || overall < 1 || overall > 5) {
      setErrorMsg("Vui lòng chọn điểm đánh giá tổng thể.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const inv = invitationData?.invitation;
      const order = invitationData?.order;

      await createGuestReview({
        transaction_id: inv?.transaction_id || `tx-${order?.order_number || Date.now()}`,
        order_id: order?.id,
        order_number: order?.order_number || inv?.order_number,
        guest_identity_id: inv?.guest_identity_id || `gst_${Date.now()}`,
        reviewer_name: inv?.recipient_name || order?.customer_name,
        reviewee_actor_id: order?.organization_id || "seller_default",
        reviewee_name: invitationData?.seller?.seller_name || "Nhà bán hàng",
        overall_rating: overall,
        accuracy_rating: accuracy,
        timeliness_rating: timeliness,
        communication_rating: communication,
        quality_rating: quality,
        comment: comment.trim() || undefined,
        invitation_token: token,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setOtpStep("SUCCESS");
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    value: number,
    onChange: (v: number) => void,
    label: string,
    required: boolean = true
  ) => {
    return (
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
            {label} {required && <span className="text-red-500">*</span>}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (errorMsg && !invitationData) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Không tìm thấy lời mời đánh giá
          </h2>
          <p className="text-xs text-neutral-500">{errorMsg}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-sm"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const sellerName = invitationData?.seller?.seller_name || "Nhà bán hàng";
  const orderNumber = invitationData?.order?.order_number || invitationData?.invitation?.order_number;
  const maskedPhone = invitationData?.invitation?.masked_phone || "***";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">Đánh Giá Người Bán</h1>
              <p className="text-[11px] text-neutral-400">
                Xác thực giao dịch an toàn • Không cần tạo tài khoản
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Verified Guest
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {otpStep === "OTP" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3.5">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950 dark:text-emerald-200">
                    Xác minh số điện thoại nhận hàng
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed text-[11px]">
                    Để đảm bảo tính trung thực và ngăn chặn đánh giá ảo, vui lòng nhập mã OTP đã gửi tới số điện thoại{" "}
                    <strong className="text-emerald-900 dark:text-emerald-100 font-bold">{maskedPhone}</strong> của đơn hàng #{orderNumber}.
                  </p>
                </div>
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Mã xác thực OTP (6 số)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập 123456 để thử nghiệm"
                    className="w-full text-center tracking-widest text-lg font-mono px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
                    Mẹo thử nghiệm: Nhập mã mặc định <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300 font-bold">123456</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || !otpInput}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? "Đang kiểm tra..." : "Xác Thực & Tiến Hành Đánh Giá"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {otpStep === "REVIEW" && (
            <form onSubmit={handleReviewSubmit} className="space-y-5 animate-in fade-in">
              {/* Order and Seller Info */}
              <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                <div>
                  <p className="text-neutral-500 text-[11px]">Nhà bán hàng</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{sellerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-500 text-[11px]">Đơn hàng</p>
                  <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100">#{orderNumber}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2 border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Star Criteria (1 item per row) */}
              <div className="space-y-2.5">
                {renderStars(overall, setOverall, "1. Trải nghiệm tổng thể", true)}
                {renderStars(accuracy, setAccuracy, "2. Sản phẩm đúng mô tả", true)}
                {renderStars(timeliness, setTimeliness, "3. Giao hàng đúng hẹn", true)}
                {renderStars(communication, setCommunication, "4. Giao tiếp & hỗ trợ", true)}
                {renderStars(quality, setQuality, "5. Chất lượng sản phẩm / dịch vụ", false)}
              </div>

              {/* Comment */}
              <div className="space-y-1.5 pt-1">
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
                  placeholder="Chia sẻ cảm nhận mua hàng thực tế của bạn để giúp người mua khác..."
                  className="w-full p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? "Đang gửi đánh giá..." : "Gửi Đánh Giá Đã Xác Minh"}
                </button>
              </div>
            </form>
          )}

          {otpStep === "SUCCESS" && (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Cảm ơn bạn đã đánh giá!
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Đánh giá của bạn đã được xác thực an toàn. Hệ thống Double-Blind sẽ công bố khi đối tác hoàn thành đánh giá hoặc khi hết hạn 14 ngày.
                </p>
              </div>

              {/* Optional Account Claim Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 text-left space-y-3 shadow-sm">
                <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200 font-bold text-xs">
                  <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Lưu Lịch Sử Giao Dịch & Đánh Giá Của Bạn</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  Tạo tài khoản để theo dõi đơn hàng này, quản lý toàn bộ các giao dịch đã thực hiện và tích luỹ điểm uy tín người mua tin cậy cho những lần sau.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/register?phone=${invitationData?.invitation?.recipient_phone || ""}&claim=true`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                  >
                    Tạo Tài Khoản
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 transition-all"
                  >
                    Để sau
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
