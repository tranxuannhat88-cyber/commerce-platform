"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, CheckCircle2, X, Loader2, Sparkles } from "lucide-react";
import { PasskeyClientService } from "@/lib/auth/passkey-client";
import { WebAuthnHelper } from "@/lib/auth/webauthn";
import { useCommerceStore } from "@/lib/db/store";
import { UserIdentity } from "@/lib/auth/types";

interface PasskeyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserIdentity;
}

export function PasskeyPromptModal({ isOpen, onClose, user }: PasskeyPromptModalProps) {
  const { addPasskey } = useCommerceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [biometricName, setBiometricName] = useState("Face ID / Vân tay");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const caps = WebAuthnHelper.detectDeviceCapabilities();
      setBiometricName(caps.biometricName);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnrollPasskey = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await PasskeyClientService.registerPasskey(user);
      if (res.success && res.credential) {
        addPasskey(res.credential);
        onClose();
      } else {
        setErrorMessage(res.error_message || "Không thể cài đặt Passkey.");
      }
    } catch (err) {
      setErrorMessage("Đã có lỗi xảy ra khi tạo Passkey.");
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

        <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Fingerprint className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đăng Nhập Nhanh Hơn</span>
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
            Kích Hoạt {biometricName}
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            Từ lần sau, bạn có thể đăng nhập vào tài khoản ngay lập tức bằng phương thức bảo mật của thiết bị mà không cần chờ mã OTP.
          </p>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
            {errorMessage}
          </p>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleEnrollPasskey}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thiết lập thiết bị...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Thiết Lập {biometricName} Ngay</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
