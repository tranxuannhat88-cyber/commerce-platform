"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Download, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { StoreTemplate, WorkContext } from "@/types";
import { formatVND } from "@/lib/utils";

interface TemplatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: StoreTemplate | null;
  currentContext: WorkContext;
  onConfirmPayment: (template: StoreTemplate) => Promise<void>;
}

export function TemplatePurchaseModal({
  isOpen,
  onClose,
  template,
  currentContext,
  onConfirmPayment,
}: TemplatePurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !template) return null;

  const actorName = currentContext.display_name || "Chủ thể hiện tại";
  const actorTypeLabel = currentContext.context_type === "ORGANIZATION" ? "Tổ chức / Doanh nghiệp" : "Tài khoản Cá nhân";

  const bankBin = "970422"; // MBBank
  const bankName = "MBBank";
  const accountNumber = "1029035329";
  const accountName = "CONG TY TNHH INVAMAX";
  const amount = template.price || 200000;
  const orderRef = `TPL_${template.code}_${Date.now().toString().slice(-6)}`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${orderRef}&accountName=${encodeURIComponent(accountName)}`;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(template);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error processing template payment:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Mở Khóa Mẫu Thành Công!
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Bản quyền mẫu <strong>{template.name}</strong> đã được kích hoạt vĩnh viễn cho <strong>{actorName}</strong>.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Áp Dụng Cho Cửa Hàng Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MẪU GIAO DIỆN CAO CẤP</span>
              </div>
              <h3 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {template.name}
              </h3>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatVND(amount)}
              </div>
              <p className="text-[11px] text-neutral-400">Mua một lần • Sử dụng vĩnh viễn cho toàn bộ cửa hàng của chủ thể</p>
            </div>

            {/* Ownership Actor Notice */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-left space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Chủ thể sở hữu:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{actorName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Loại chủ thể:</span>
                <span className="text-neutral-700 dark:text-neutral-300">{actorTypeLabel}</span>
              </div>
            </div>

            {/* VietQR Code Box */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-inner flex flex-col items-center justify-center space-y-3">
              <img
                src={vietQrUrl}
                alt="VietQR Napas247"
                className="w-52 h-52 object-contain rounded-lg"
              />
              <div className="text-[11px] font-mono text-neutral-600 space-y-0.5">
                <p>Nội dung CK: <strong className="text-blue-600">{orderRef}</strong></p>
                <p>Chủ TK: <strong>{accountName}</strong></p>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực thanh toán...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tôi Đã Thanh Toán (Xác Nhận Tức Thì)</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Để sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
