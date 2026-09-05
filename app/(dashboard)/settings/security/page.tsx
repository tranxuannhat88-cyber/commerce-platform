"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Phone,
  Fingerprint,
  Smartphone,
  Laptop,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Mail,
  ArrowLeft,
  Loader2,
  KeyRound,
  Info,
  Camera,
  User,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { PhoneNormalizationService } from "@/lib/auth/phone";
import { PasskeyClientService } from "@/lib/auth/passkey-client";
import { WebAuthnHelper } from "@/lib/auth/webauthn";
import { StepUpModal } from "@/components/auth/step-up-modal";
import { PasskeyPromptModal } from "@/components/auth/passkey-prompt-modal";
import { OTPService } from "@/lib/auth/otp-service";
import { PasskeyCredential } from "@/lib/auth/types";

export default function SecuritySettingsPage() {
  const {
    currentUser,
    currentSession,
    passkeys,
    addPasskey,
    removePasskey,
    renamePasskey,
    updatePrimaryPhone,
    updateUserProfile,
    logoutAllSessions,
    isStepUpValid,
  } = useCommerceStore();

  // Modals state
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<(() => void) | null>(null);
  const [stepUpTitle, setStepUpTitle] = useState("");

  const [showAddPasskeyModal, setShowAddPasskeyModal] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState("");

  // Change Phone state
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  // Email recovery state
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser?.primary_email || "");
  const [emailSaved, setEmailSaved] = useState(false);

  // Helper: Trigger sensitive action with Step-up protection
  const executeWithStepUp = (title: string, action: () => void) => {
    if (isStepUpValid(15)) {
      action();
    } else {
      setStepUpTitle(title);
      setStepUpAction(() => action);
      setShowStepUpModal(true);
    }
  };

  // 1. Rename Passkey
  const handleStartRename = (pk: PasskeyCredential) => {
    setRenamingId(pk.id);
    setRenamingText(pk.device_name);
  };

  const handleSaveRename = (pkId: string) => {
    if (renamingText.trim()) {
      renamePasskey(pkId, renamingText.trim());
    }
    setRenamingId(null);
  };

  // 2. Delete Passkey
  const handleDeletePasskey = (pk: PasskeyCredential) => {
    executeWithStepUp(`Xóa Passkey: ${pk.device_name}`, () => {
      removePasskey(pk.id);
    });
  };

  // 3. Change Phone Number Workflow
  const handleStartChangePhone = () => {
    executeWithStepUp("Đổi Số Điện Thoại Đăng Nhập", () => {
      setIsChangingPhone(true);
      setOtpSent(false);
      setPhoneError(null);
      setNewPhone("");
      setOtpCode("");
    });
  };

  const handleRequestNewPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const normalized = PhoneNormalizationService.normalize(newPhone);
    if (!PhoneNormalizationService.isValidVietnamPhone(newPhone) && !normalized.startsWith("+")) {
      setPhoneError("Số điện thoại mới không hợp lệ.");
      return;
    }

    if (normalized === currentUser?.primary_phone) {
      setPhoneError("Số điện thoại mới trùng với số điện thoại hiện tại.");
      return;
    }

    setIsPhoneLoading(true);
    try {
      const res = await OTPService.requestOTP(newPhone, "CHANGE_PHONE");
      if (res.success) {
        setOtpSent(true);
        setCooldown(60);
      } else {
        setPhoneError(res.error_message || "Không thể gửi mã xác minh.");
      }
    } catch {
      setPhoneError("Lỗi kết nối.");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleVerifyNewPhone = async () => {
    if (!otpCode || otpCode.length < 6) {
      setPhoneError("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsPhoneLoading(true);
    setPhoneError(null);

    try {
      const res = await OTPService.verifyOTP(newPhone, otpCode);
      if (res.verified) {
        updatePrimaryPhone(newPhone);
        setIsChangingPhone(false);
      } else {
        setPhoneError(res.error_message || "Mã xác minh không đúng.");
      }
    } catch {
      setPhoneError("Xác minh thất bại.");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  // 4. Save Recovery Email
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryEmail.trim()) {
      updateUserProfile({ primary_email: recoveryEmail.trim(), is_email_verified: true });
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 3000);
    }
  };

  // Avatar upload handler
  const compressImageFile = (file: File, maxDim = 400, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 0.75);
      updateUserProfile({ avatar_url: compressed });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAvatar = () => {
    updateUserProfile({ avatar_url: "" });
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-xs text-neutral-500">Vui lòng đăng nhập để quản lý bảo mật.</p>
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cài đặt chung</span>
          </Link>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-blue-600" />
            <span>Tài Khoản & Bảo Mật</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Quản lý phương thức xác thực, Passkey thiết bị và bảo mật tài khoản người dùng
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-mono font-bold flex items-center gap-1.5">
          <span>User ID:</span>
          <span className="text-neutral-900 dark:text-neutral-100">{currentUser.user_code}</span>
        </div>
      </div>

      {/* SECTION 0: ẢNH ĐẠI DIỆN & ĐỊNH DANH CÁ NHÂN */}
      <div className="p-5 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="relative w-16 h-16 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-neutral-800">
          {currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt="Ảnh đại diện"
              className="w-full h-full object-cover"
            />
          ) : (
            (currentUser.full_name?.trim() ? currentUser.full_name.trim().charAt(0).toUpperCase() : "U")
          )}
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {currentUser.full_name || "Tài khoản cá nhân"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Ảnh đại diện hiển thị trên thanh điều hướng, menu chuyển không gian làm việc và giao diện cá nhân.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold self-center sm:self-start">
              {currentUser.avatar_url ? "Đã đặt ảnh tùy chỉnh" : "Mặc định (Chữ cái)"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
              <Camera className="w-3.5 h-3.5" />
              <span>{currentUser.avatar_url ? "Đổi ảnh đại diện" : "Chọn ảnh từ thiết bị"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>

            {currentUser.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Xóa ảnh (dùng chữ cái)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: PHƯƠNG THỨC ĐĂNG NHẬP CHÍNH (PHONE OTP) */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Số Điện Thoại Xác Thực
              </h3>
              <p className="text-[11px] text-neutral-500">
                Dùng để nhận mã OTP khởi tạo phiên và khôi phục tài khoản
              </p>
            </div>
          </div>

          {!isChangingPhone && (
            <button
              type="button"
              onClick={handleStartChangePhone}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Đổi Số Điện Thoại
            </button>
          )}
        </div>

        {!isChangingPhone ? (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
                {PhoneNormalizationService.formatDisplay(currentUser.primary_phone)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã xác minh</span>
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">Mặc định</span>
          </div>
        ) : (
          /* Change phone form */
          <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/40">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Nhập số điện thoại mới
              </h4>
              <button
                type="button"
                onClick={() => setIsChangingPhone(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Hủy bỏ
              </button>
            </div>

            {phoneError && (
              <p className="text-xs text-rose-600 font-medium">{phoneError}</p>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestNewPhoneOTP} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Số điện thoại mới
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0988 999 888"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPhoneLoading || !newPhone.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {isPhoneLoading ? "Đang gửi mã..." : "Gửi mã xác minh tới số mới"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Mã OTP 6 số đã được gửi tới: <strong>{newPhone}</strong>
                </p>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 text-center text-base font-black font-mono tracking-widest rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={isPhoneLoading || otpCode.length < 6}
                    onClick={handleVerifyNewPhone}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shrink-0 cursor-pointer"
                  >
                    {isPhoneLoading ? "Đang lưu..." : "Xác nhận đổi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: PASSKEYS (FACE ID / VÂN TAY / WINDOWS HELLO) */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Passkeys & Sinh Trắc Học Thiết Bị
              </h3>
              <p className="text-[11px] text-neutral-500">
                Đăng nhập 1 chạm an toàn bằng Face ID, Touch ID, Vân tay hoặc Windows Hello
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPasskeyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Passkey</span>
          </button>
        </div>

        {/* Passkey list */}
        <div className="space-y-3">
          {passkeys.length === 0 ? (
            <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 text-center space-y-2 border border-dashed border-neutral-200 dark:border-neutral-700">
              <KeyRound className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-500">Bạn chưa thiết lập Passkey nào trên tài khoản.</p>
              <button
                type="button"
                onClick={() => setShowAddPasskeyModal(true)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Cài đặt Passkey cho thiết bị này
              </button>
            </div>
          ) : (
            passkeys.map((pk) => (
              <div
                key={pk.id}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center text-neutral-600 dark:text-neutral-200 shrink-0">
                    {pk.device_type === "apple" ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    {renamingId === pk.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renamingText}
                          onChange={(e) => setRenamingText(e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg border border-blue-500 bg-white dark:bg-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(pk.id)}
                          className="text-xs font-bold text-blue-600"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {pk.device_name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleStartRename(pk)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                          title="Đổi tên thiết bị"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-neutral-400">
                      Tạo ngày {new Date(pk.created_at).toLocaleDateString("vi-VN")} • Dùng gần nhất:{" "}
                      {new Date(pk.last_used_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    WebAuthn Active
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePasskey(pk)}
                    className="p-2 text-neutral-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Xóa Passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Domain note */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <p className="leading-relaxed">
            <strong>Tên miền hoạt động:</strong> Nền tảng hoạt động chính thức tại <code>app.hinex.vn</code>. Passkey gắn liền với tên miền để bảo mật tối đa cho tài khoản của bạn.
          </p>
        </div>
      </div>

      {/* SECTION 3: EMAIL PHỤC HỒI (RECOVERY EMAIL) */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Email Khôi Phục & Nhận Thông Báo
            </h3>
            <p className="text-[11px] text-neutral-500">
              Dùng để nhận hóa đơn điện tử, báo cáo định kỳ và khôi phục quyền truy cập
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEmail} className="flex items-center gap-3 max-w-md">
          <input
            type="email"
            placeholder="email@company.vn"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            {emailSaved ? "Đã Lưu ✓" : "Lưu Email"}
          </button>
        </form>
      </div>

      {/* SECTION 4: PHIÊN ĐĂNG NHẬP (ACTIVE SESSIONS) */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Phiên Đăng Nhập Hoạt Động
              </h3>
              <p className="text-[11px] text-neutral-500">
                Danh sách các thiết bị đang có quyền truy cập vào tài khoản
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutAllSessions}
            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tất Cả</span>
          </button>
        </div>

        {currentSession && (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {currentSession.device_name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Thiết bị hiện tại
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                IP: {currentSession.ip_address || "14.232.xxx.xxx"} • Đăng nhập:{" "}
                {new Date(currentSession.last_active_at).toLocaleTimeString("vi-VN")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step-up Re-authentication Modal */}
      <StepUpModal
        isOpen={showStepUpModal}
        onClose={() => {
          setShowStepUpModal(false);
          setStepUpAction(null);
        }}
        onSuccess={() => {
          if (stepUpAction) stepUpAction();
        }}
        actionTitle={stepUpTitle}
      />

      {/* Add Passkey Modal */}
      <PasskeyPromptModal
        isOpen={showAddPasskeyModal}
        onClose={() => setShowAddPasskeyModal(false)}
        user={currentUser}
      />
    </div>
  );
}
