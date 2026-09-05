"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Fingerprint,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Store,
} from "lucide-react";
import { PhoneNormalizationService } from "@/lib/auth/phone";
import { OTPService } from "@/lib/auth/otp-service";
import { PasskeyClientService } from "@/lib/auth/passkey-client";
import { WebAuthnHelper } from "@/lib/auth/webauthn";
import { useCommerceStore } from "@/lib/db/store";
import { PasskeyPromptModal } from "@/components/auth/passkey-prompt-modal";
import { WelcomeNameModal } from "@/components/auth/welcome-name-modal";
import { UserIdentity } from "@/lib/auth/types";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPhone, loginWithPasskey, passkeys, currentUser } = useCommerceStore();

  const [step, setStep] = useState<"PHONE_INPUT" | "OTP_INPUT">("PHONE_INPUT");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const [deviceBiometricLabel, setDeviceBiometricLabel] = useState("Face ID / Vân tay");

  const [loggedUser, setLoggedUser] = useState<UserIdentity | null>(null);
  const [showWelcomeName, setShowWelcomeName] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    WebAuthnHelper.isPasskeySupported().then((supported) => {
      setIsPasskeySupported(supported);
      const caps = WebAuthnHelper.detectDeviceCapabilities();
      setDeviceBiometricLabel(caps.biometricName);
    });
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const normalized = PhoneNormalizationService.normalize(phone);
    if (!PhoneNormalizationService.isValidVietnamPhone(phone) && !normalized.startsWith("+")) {
      setErrorMessage("Vui lòng nhập số điện thoại hợp lệ (Ví dụ: 0988 123 456).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await OTPService.requestOTP(phone, "REGISTER_OR_LOGIN");
      if (!res.success) {
        setErrorMessage(res.error_message || "Không thể gửi mã xác minh. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }

      setCooldown(res.cooldown_seconds || 60);
      if (res.demo_code) setDemoCode(res.demo_code);
      setStep("OTP_INPUT");
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      setErrorMessage("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join("");
    if (fullCode.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await OTPService.verifyOTP(phone, fullCode);
      if (!res.verified) {
        setErrorMessage(res.error_message || "Mã xác minh không đúng.");
        setIsLoading(false);
        return;
      }

      const normalized = PhoneNormalizationService.normalize(phone);
      const { user } = loginWithPhone(normalized);
      setLoggedUser(user);

      const isNew = !user.full_name || user.full_name === "Người Dùng Mới";

      if (isNew) {
        setShowWelcomeName(true);
      } else {
        router.push("/store");
      }
    } catch (err) {
      setErrorMessage("Xác minh không thành công.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every((d) => d !== "")) {
      handleVerifyOTP(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").substring(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyOTP(pasted);
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await PasskeyClientService.authenticateWithPasskey(passkeys);
      if (!res.success) {
        setErrorMessage(res.error_message || "Không thể xác thực bằng Passkey.");
        setIsLoading(false);
        return;
      }

      if (res.credential_id) {
        loginWithPasskey(res.credential_id);
        router.push("/store");
      }
    } catch (err) {
      setErrorMessage("Xác thực Passkey thất bại. Vui lòng dùng số điện thoại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans flex items-center justify-center p-4 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center p-2 mx-auto shadow-sm">
            <img
              src="/icons/hinex-mark.png?v=2.1.0"
              alt="Hinex"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/icon-192.png";
              }}
            />
          </div>
          <h2 className="text-xl font-black tracking-tight">Đăng Nhập / Tiếp Tục</h2>
          <p className="text-xs text-neutral-500">
            Đăng nhập tức thì bằng Số điện thoại hoặc Face ID / Vân tay không cần mật khẩu
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: PHONE INPUT */}
        {step === "PHONE_INPUT" && (
          <div className="space-y-4">
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-neutral-500 font-bold text-xs">
                    <span>🇻🇳 +84</span>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                  </div>
                  <input
                    type="tel"
                    autoFocus
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-20 pr-4 py-3 text-base sm:text-sm font-semibold rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG GỬI MÃ...</span>
                  </>
                ) : (
                  <>
                    <span>TIẾP TỤC VỚI SỐ ĐIỆN THOẠI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {isPasskeySupported && passkeys.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center space-y-2">
                <p className="text-[11px] text-neutral-400">hoặc đăng nhập nhanh bằng</p>
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Fingerprint className="w-4 h-4 text-blue-600" />
                  <span>Đăng nhập bằng {deviceBiometricLabel}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === "OTP_INPUT" && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-neutral-500">Mã xác minh 6 số đã được gửi tới:</p>
              <p className="text-sm font-black font-mono text-neutral-900 dark:text-neutral-100">
                {PhoneNormalizationService.maskPhone(phone)}
              </p>
            </div>

            {demoCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Mã thử nghiệm Public Test: <strong>{demoCode}</strong></span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black font-mono rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                />
              ))}
            </div>

            <button
              type="button"
              disabled={isLoading || otpDigits.some((d) => !d)}
              onClick={() => handleVerifyOTP()}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ĐANG XÁC MINH...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN MÃ OTP</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setStep("PHONE_INPUT")}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
              >
                ← Đổi số điện thoại
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={() => handleRequestOTP()}
                className={`font-bold ${
                  cooldown > 0
                    ? "text-neutral-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700 cursor-pointer"
                }`}
              >
                {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Name Onboarding Modal */}
      {loggedUser && (
        <WelcomeNameModal
          isOpen={showWelcomeName}
          onClose={() => setShowWelcomeName(false)}
          onFinish={() => {
            setShowWelcomeName(false);
            setShowPasskeyPrompt(true);
          }}
          user={loggedUser}
        />
      )}

      {/* Passkey Setup Prompt */}
      {loggedUser && (
        <PasskeyPromptModal
          isOpen={showPasskeyPrompt}
          onClose={() => {
            setShowPasskeyPrompt(false);
            router.push("/store");
          }}
          user={loggedUser}
        />
      )}
    </div>
  );
}
