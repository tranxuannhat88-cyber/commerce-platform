"use client";

import React, { useState } from "react";
import { ShieldAlert, Fingerprint, Phone, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { PasskeyClientService } from "@/lib/auth/passkey-client";
import { OTPService } from "@/lib/auth/otp-service";
import { PhoneNormalizationService } from "@/lib/auth/phone";

interface StepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export function StepUpModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = "Xác Thực Hành Động Nhạy Cảm",
  actionDescription = "Vui lòng xác thực danh tính bằng Face ID / Vân tay hoặc mã OTP gửi về số điện thoại trước khi tiếp tục.",
}: StepUpModalProps) {
  const { currentUser, passkeys, performStepUpAuth } = useCommerceStore();
  const [method, setMethod] = useState<"PASSKEY" | "OTP">("PASSKEY");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!isOpen || !currentUser) return null;

  // 1. Passkey Step-up
  const handlePasskeyStepUp = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await PasskeyClientService.authenticateWithPasskey(passkeys);
      if (res.success) {
        performStepUpAuth("PASSKEY");
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error_message || "Xác thực Passkey không thành công.");
      }
    } catch (err) {
      setErrorMessage("Lỗi xác thực thiết bị. Bạn có thể dùng mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Request OTP Step-up
  const handleRequestOTP = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await OTPService.requestOTP(currentUser.primary_phone, "STEP_UP");
      if (res.success) {
        setOtpSent(true);
        setCooldown(60);
      } else {
        setErrorMessage(res.error_message || "Không thể gửi mã OTP.");
      }
    } catch (err) {
      setErrorMessage("Lỗi gửi mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP Step-up
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await OTPService.verifyOTP(currentUser.primary_phone, otpCode);
      if (res.verified) {
        performStepUpAuth("PHONE_OTP");
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error_message || "Mã xác minh không đúng.");
      }
    } catch (err) {
      setErrorMessage("Lỗi xác minh mã OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
            {actionTitle}
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            {actionDescription}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {method === "PASSKEY" && (
          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handlePasskeyStepUp}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Xác thực bằng Face ID / Vân tay</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod("OTP");
                handleRequestOTP();
              }}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              Dùng mã OTP qua số điện thoại ({PhoneNormalizationService.maskPhone(currentUser.primary_phone)})
            </button>
          </div>
        )}

        {method === "OTP" && (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Nhập mã OTP 6 số đã gửi tới {PhoneNormalizationService.maskPhone(currentUser.primary_phone)}
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full py-3 px-4 text-center text-lg font-black font-mono tracking-widest rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || otpCode.length < 6}
              onClick={handleVerifyOTP}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác minh...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN MÃ OTP</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMethod("PASSKEY")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                ← Quay lại xác thực bằng Passkey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
