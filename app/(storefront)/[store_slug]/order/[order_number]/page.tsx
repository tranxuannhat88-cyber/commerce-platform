"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  Check,
  Zap,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Bookmark,
  Lock,
  User,
  Phone,
  Mail,
  ArrowRight,
  X,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDateTime, isValidVietnamesePhone, getPhoneValidationError, cleanPhoneNumber } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.store_slug as string) || "2k-store";
  const orderNumber = params?.order_number as string;

  const { orders, store, confirmPayment } = useCommerceStore();
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Progressive Identity: Guest Claim Order Modal State
  const [showSaveOrderModal, setShowSaveOrderModal] = useState(false);
  const [modalStep, setModalStep] = useState<"FORM" | "OTP" | "SUCCESS">("FORM");
  const [isOrderSaved, setIsOrderSaved] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP State
  const [generatedOTP, setGeneratedOTP] = useState("686868");
  const [enteredOTP, setEnteredOTP] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const order = orders.find((o) => o.order_number === orderNumber) || orders[0];

  useEffect(() => {
    if (order) {
      setRegName(order.customer_name || "");
      const cleaned = cleanPhoneNumber(order.customer_phone || "");
      setRegPhone(cleaned);
      setRegEmail(order.customer_email || "");
      if (cleaned) {
        setPhoneError(getPhoneValidationError(cleaned));
      }
    }
  }, [order]);

  // Countdown for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (modalStep === "OTP" && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    } else if (otpCountdown === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [modalStep, otpCountdown]);

  const isPaid = order?.payment?.payment_status === "PAID";
  const isCOD = order?.payment?.payment_method === "COD";
  const isQuoting = order?.shipping_status === "QUOTING";
  const isQuoted = order?.shipping_status === "QUOTED";

  // Trigger confetti when paid
  useEffect(() => {
    if (isPaid) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isPaid]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-base font-bold">Không tìm thấy đơn hàng</p>
          <Link href={`/${storeSlug}`} className="mt-3 inline-block text-blue-600 font-semibold text-xs">
            ← Quay lại Cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSimulateWebhook = () => {
    setIsSimulating(true);
    setTimeout(() => {
      confirmPayment(order.id);
      setIsSimulating(false);
    }, 800);
  };

  // Realtime phone input handler with strict validation
  const handlePhoneChange = (val: string) => {
    // Only allow digits and leading +
    const cleaned = val.replace(/[^\d+]/g, "");
    setRegPhone(cleaned);
    setPhoneError(getPhoneValidationError(cleaned));
  };

  // Step 1: Submit Form -> Validate Phone & Send OTP
  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();

    const err = getPhoneValidationError(regPhone);
    if (err) {
      setPhoneError(err);
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      alert("Mật khẩu cần ít nhất 6 ký tự để bảo mật tài khoản.");
      return;
    }

    // Generate simulated OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOtp);
    setEnteredOTP("");
    setOtpError(null);
    setOtpCountdown(60);
    setCanResendOtp(false);
    setModalStep("OTP");
  };

  // Resend OTP
  const handleResendOTP = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOtp);
    setEnteredOTP("");
    setOtpError(null);
    setOtpCountdown(60);
    setCanResendOtp(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOTP !== generatedOTP && enteredOTP !== "686868") {
      setOtpError("Mã OTP không chính xác. Vui lòng kiểm tra lại tin nhắn hoặc điền mã đúng.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    setTimeout(() => {
      setIsVerifyingOtp(false);
      setModalStep("SUCCESS");
      setIsOrderSaved(true);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    }, 600);
  };

  const bankAccount = store.payment_settings?.bank_account_no || "098812345688";
  const bankName = store.payment_settings?.bank_name || "MBBank";
  const accountHolder = store.payment_settings?.bank_account_name || "CONG TY TNHH KY THUAT 2K";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{store.store_name}</span>
          </Link>
          <span className="font-mono text-xs font-bold text-neutral-500">
            {order.order_number}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Hero Card */}
        {isPaid ? (
          <div className="p-6 md:p-8 rounded-3xl bg-emerald-600 text-white text-center space-y-3 shadow-xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white backdrop-blur-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">✓ THANH TOÁN THÀNH CÔNG!</h2>
            <p className="text-xs text-emerald-100 max-w-md mx-auto">
              Hệ thống đã nhận được tiền và tự động gửi thông báo chuẩn bị hàng tới người bán.
            </p>
          </div>
        ) : isQuoting ? (
          <div className="p-6 md:p-8 rounded-3xl bg-amber-600 text-white text-center space-y-3 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white backdrop-blur-md">
              <Clock className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <span>Đang Chờ Báo Phí Vận Chuyển</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">YÊU CẦU ĐẶT HÀNG ĐÃ ĐƯỢC GỬI!</h2>
            <p className="text-xs text-amber-100 max-w-md mx-auto leading-relaxed">
              Đơn hàng của bạn đang được Người bán kiểm tra trọng lượng / vị trí để báo cước vận chuyển chính xác. <strong>Bạn chưa cần thanh toán ngay lúc này.</strong>
            </p>
          </div>
        ) : isQuoted && !isPaid && !isCOD ? (
          <div className="p-6 md:p-8 rounded-3xl bg-indigo-600 text-white text-center space-y-3 shadow-xl animate-in zoom-in-95">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <span>✓ Phí Vận Chuyển Đã Được Cập Nhật</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {formatVND(order.total_amount)}
            </h2>
            <p className="text-xs text-indigo-100 max-w-md mx-auto">
              Người bán đã xác nhận cước vận chuyển {formatVND(order.shipping_fee)}. Quý khách vui lòng quét mã VietQR bên dưới để thanh toán.
            </p>
          </div>
        ) : isCOD ? (
          <div className="p-6 md:p-8 rounded-3xl bg-amber-600 text-white text-center space-y-3 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white backdrop-blur-md">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">ĐẶT HÀNG THÀNH CÔNG (COD)</h2>
            <p className="text-xs text-amber-100 max-w-md mx-auto">
              Đơn hàng của bạn đã được ghi nhận. Bạn sẽ thanh toán {formatVND(order.total_amount)} khi nhận hàng.
            </p>
          </div>
        ) : (
          <div className="p-6 md:p-8 rounded-3xl bg-linear-to-b from-blue-600 to-indigo-700 text-white text-center space-y-3 shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Đang Chờ Chuyển Khoản / Quét QR</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {formatVND(order.total_amount)}
            </h2>
            <p className="text-xs text-blue-100 max-w-md mx-auto">
              Vui lòng mở ứng dụng Ngân hàng (App Bank) để quét mã QR bên dưới. Hệ thống sẽ tự động xác nhận ngay khi bạn chuyển tiền!
            </p>
          </div>
        )}

        {/* Dynamic QR Payment Box (if not paid & Bank transfer & not quoting) */}
        {!isPaid && !isCOD && !isQuoting && (
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Dynamic QR Code Image */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-neutral-200 text-center shrink-0">
                <img
                  src={order.payment?.qr_code_url}
                  alt="VietQR Payment"
                  className="w-56 h-56 object-contain rounded-xl"
                />
                <p className="text-[10px] text-neutral-400 font-mono mt-2">
                  Chuẩn VietQR NAPAS 24/7
                </p>
              </div>

              {/* Bank Details */}
              <div className="flex-1 space-y-3 w-full text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400">Ngân hàng thụ hưởng:</span>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{bankName}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400">Số tài khoản:</span>
                    <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                      {bankAccount}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(bankAccount, setCopiedBank)}
                    className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  >
                    {copiedBank ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400">Chủ tài khoản:</span>
                    <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100 uppercase">
                      {accountHolder}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400">Nội dung chuyển khoản (Bắt buộc):</span>
                    <p className="font-mono font-black text-blue-600 text-sm">
                      {order.order_number.replace(/[^a-zA-Z0-9]/g, "")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(order.order_number.replace(/[^a-zA-Z0-9]/g, ""), setCopiedRef)}
                    className="p-1.5 text-neutral-500 hover:text-blue-600 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Simulation Webhook CTA */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Kiểm thử xác nhận thanh toán Realtime:</span>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Nhấn để giả lập Webhook từ Ngân hàng gửi tín hiệu xác nhận về hệ thống.
                </p>
              </div>

              <button
                onClick={handleSimulateWebhook}
                disabled={isSimulating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSimulating ? "Đang xác nhận..." : "Giả Lập Thanh Toán Ngay"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Order Items & Customer Summary */}
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            Chi tiết đơn hàng
          </h3>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.item_name}</p>
                  {item.variant_name && <p className="text-neutral-500">Phân loại: {item.variant_name}</p>}
                  <p className="text-neutral-400">{formatVND(item.unit_price)} × {item.quantity}</p>
                </div>
                <div className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatVND(item.total_price)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Tạm tính (Tiền hàng):</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{formatVND(order.subtotal)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Giảm giá:</span>
                <span>-{formatVND(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-500">
              <span className="flex items-center gap-1">
                <span>Phí vận chuyển:</span>
                {order.shipping_snapshot?.method_name && (
                  <span className="text-[10px] text-neutral-400">({order.shipping_snapshot.method_name})</span>
                )}
              </span>
              <span className="font-bold">
                {isQuoting ? (
                  <span className="text-amber-600">Chờ người bán báo phí</span>
                ) : order.shipping_fee === 0 ? (
                  <span className="text-emerald-600">0đ (Miễn phí)</span>
                ) : (
                  <span className="text-neutral-800 dark:text-neutral-200">{formatVND(order.shipping_fee)}</span>
                )}
              </span>
            </div>

            {order.shipping_snapshot?.quote_notes && (
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-[11px] text-neutral-500">
                💬 Ghi chú vận chuyển: {order.shipping_snapshot.quote_notes}
              </div>
            )}

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-black text-sm text-neutral-900 dark:text-neutral-100">
              <span>Tổng thanh toán:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {isQuoting ? `${formatVND(order.subtotal)} + Cước xe tải` : formatVND(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PROGRESSIVE IDENTITY: GUEST SAVE ORDER ACTION BOX                         */}
        {/* ========================================================================= */}
        <div className="p-6 bg-linear-to-r from-blue-50 via-indigo-50 to-blue-100/60 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-900/30 rounded-3xl border border-blue-200 dark:border-blue-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Bookmark className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-blue-950 dark:text-blue-200">
                {isOrderSaved ? "✓ Đã Lưu Thông Tin Đặt Hàng" : "Lưu Thông Tin Đặt Hàng"}
              </h3>
            </div>
            <p className="text-xs text-blue-800/80 dark:text-blue-300/80 max-w-md leading-relaxed">
              {isOrderSaved
                ? `Đơn hàng #${order.order_number} đã được gắn vào tài khoản của ${regName || "bạn"}. Bạn có thể tra cứu bất kỳ lúc nào!`
                : "Tạo tài khoản nhanh để lưu lại đơn hàng, tra cứu tiến độ vận chuyển và bảo hành mà không cần ghi nhớ mã đơn."}
            </p>
          </div>

          <div>
            {isOrderSaved ? (
              <Link
                href="/sell/orders"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Xem Trong Quản Lý Đơn</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setModalStep("FORM");
                  setShowSaveOrderModal(true);
                }}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Bookmark className="w-4 h-4" />
                <span>Lưu thông tin đặt hàng</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 2-STEP MODAL: ĐĂNG KÝ TÀI KHOẢN & XÁC THỰC OTP SỐ ĐIỆN THOẠI             */}
      {/* ========================================================================= */}
      {showSaveOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                  {modalStep === "OTP" ? <KeyRound className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                    {modalStep === "OTP" ? "Xác Thực Số Điện Thoại OTP" : "Tạo Tài Khoản Lưu Đơn Hàng"}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Mã đơn #{order.order_number}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSaveOrderModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: FORM INPUT WITH STRICT PHONE VALIDATION */}
            {modalStep === "FORM" && (
              <form onSubmit={handleRequestOTP} className="space-y-4 text-xs">
                {/* Notice banner */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Bạn cần đăng ký tài khoản để lưu thông tin đặt hàng</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Vui lòng kiểm tra lại số điện thoại chính xác để nhận mã OTP kích hoạt và bảo vệ quyền sở hữu đơn hàng.
                  </p>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        required
                        placeholder="Họ và tên của bạn"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* PHONE NUMBER FIELD WITH STRICT REALTIME VALIDATION */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                        Số điện thoại đăng nhập * (Chuẩn 10 số)
                      </label>
                      {regPhone && !phoneError && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Hợp lệ</span>
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Phone
                        className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                          phoneError ? "text-red-500" : regPhone ? "text-emerald-500" : "text-neutral-400"
                        }`}
                      />
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="Ví dụ: 0912345678"
                        value={regPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border font-mono font-bold text-neutral-900 dark:text-neutral-100 focus:outline-hidden transition-all ${
                          phoneError
                            ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                            : regPhone
                            ? "border-emerald-500 ring-2 ring-emerald-500/10"
                            : "border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500"
                        }`}
                      />
                    </div>

                    {phoneError && (
                      <p className="text-[11px] font-medium text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Email nhận thông báo
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        placeholder="email@domain.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Thiết lập Mật khẩu đăng nhập * (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Nhập mật khẩu mới..."
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={Boolean(phoneError) || !regPhone || !regPassword}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⚡ Gửi Mã OTP Xác Thực Số Điện Thoại</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION SCREEN */}
            {modalStep === "OTP" && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs animate-in fade-in">
                {/* Simulated SMS banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tin nhắn SMS đã gửi tới: <strong>{regPhone}</strong></span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-[10px] font-black font-mono">
                      MÃ: {generatedOTP}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-800 text-[10px]">
                    <span className="text-emerald-700 dark:text-emerald-300">
                      Mã OTP thử nghiệm: <strong>{generatedOTP}</strong> (hoặc <strong>686868</strong>)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEnteredOTP(generatedOTP);
                        setOtpError(null);
                      }}
                      className="text-emerald-700 dark:text-emerald-300 font-bold underline cursor-pointer hover:text-emerald-900"
                    >
                      Điền nhanh mã OTP
                    </button>
                  </div>
                </div>

                {/* OTP Input Field */}
                <div className="space-y-2 text-center py-2">
                  <label className="block font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                    Nhập 6 chữ số mã OTP xác minh:
                  </label>

                  <div className="flex justify-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="• • • • • •"
                      value={enteredOTP}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setEnteredOTP(digits);
                        setOtpError(null);
                      }}
                      className="w-56 text-center tracking-[0.6em] text-2xl font-black font-mono py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{otpError}</span>
                    </p>
                  )}
                </div>

                {/* Countdown & Resend Option */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalStep("FORM")}
                    className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 hover:underline cursor-pointer"
                  >
                    ← Đổi số điện thoại khác
                  </button>

                  <div>
                    {canResendOtp ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Gửi lại mã OTP</span>
                      </button>
                    ) : (
                      <span>Gửi lại sau <strong className="font-mono text-neutral-700 dark:text-neutral-300">{otpCountdown}s</strong></span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enteredOTP.length !== 6 || isVerifyingOtp}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isVerifyingOtp ? "Đang xác thực..." : "✓ Xác Nhận OTP & Hoàn Tất Tạo Tài Khoản"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {modalStep === "SUCCESS" && (
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                    🎉 Đã Xác Thực & Kích Hoạt Tài Khoản Thành Công!
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    Số điện thoại <strong>{regPhone}</strong> đã được xác minh. Đơn hàng <strong>#{order.order_number}</strong> đã được liên kết vĩnh viễn vào tài khoản của bạn.
                  </p>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowSaveOrderModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer"
                  >
                    Ở lại trang này
                  </button>

                  <Link
                    href="/sell/orders"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Vào trang Quản Lý Đơn</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
