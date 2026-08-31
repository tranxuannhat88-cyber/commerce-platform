"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, ExternalLink, CreditCard, Globe, Copy, Check } from "lucide-react";
import { CopyButton } from "./copy-button";

export interface BankInfo {
  bank_name?: string;
  bank_short_name?: string;
  bank_bin?: string;
  account_number?: string;
  account_name?: string;
  qr_image_url?: string;
  vietqr_url?: string;
}

export interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
  bankInfo?: BankInfo;
}

export function QRModal({ isOpen, onClose, url, title, subtitle, bankInfo }: QRModalProps) {
  const hasVietQR = Boolean(bankInfo && bankInfo.account_number);
  const [activeTab, setActiveTab] = useState<"LINK" | "VIETQR">(hasVietQR ? "VIETQR" : "LINK");
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    if (bankInfo?.account_number) {
      navigator.clipboard.writeText(bankInfo.account_number);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 pr-6">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm font-semibold text-blue-600 dark:text-blue-400">{subtitle}</p>
        )}

        {/* Tab Selector */}
        {hasVietQR && (
          <div className="flex items-center justify-center gap-1 p-1 mt-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("VIETQR")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "VIETQR"
                  ? "bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>VietQR Thanh Toán</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LINK")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "LINK"
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Link Trang Web</span>
            </button>
          </div>
        )}

        {/* TAB 1: VIETQR */}
        {activeTab === "VIETQR" && bankInfo && (
          <div className="my-4 space-y-3 animate-in fade-in">
            <div className="flex justify-center p-3 bg-white rounded-2xl shadow-inner border border-emerald-100 dark:border-neutral-800 w-fit mx-auto">
              {bankInfo.qr_image_url ? (
                <img
                  src={bankInfo.qr_image_url}
                  alt="VietQR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : bankInfo.vietqr_url ? (
                <img
                  src={bankInfo.vietqr_url}
                  alt="VietQR Code"
                  className="w-56 h-auto max-h-72 object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <QRCodeSVG
                  value={`https://img.vietqr.io/image/${bankInfo.bank_bin || "970422"}-${bankInfo.account_number}-compact2.png`}
                  size={200}
                  level="H"
                  includeMargin
                />
              )}
            </div>

            {/* Bank details card */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px]">Ngân hàng:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{bankInfo.bank_short_name || bankInfo.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px]">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">{bankInfo.account_number}</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="p-1 text-neutral-400 hover:text-blue-600 rounded cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px]">Chủ tài khoản:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase">{bankInfo.account_name}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LINK WEB QR */}
        {activeTab === "LINK" && (
          <div className="my-4 space-y-3 animate-in fade-in">
            <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner border border-neutral-100 w-fit mx-auto">
              <QRCodeSVG value={url} size={200} level="H" includeMargin />
            </div>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-[11px] font-mono text-neutral-600 dark:text-neutral-300 break-all border border-neutral-200 dark:border-neutral-700">
              {url}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {activeTab === "VIETQR" && bankInfo?.vietqr_url ? (
            <a
              href={bankInfo.vietqr_url}
              download={`vietqr-${bankInfo.account_number}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Mã VietQR</span>
            </a>
          ) : (
            <CopyButton text={url} label="Copy Link" className="py-2 px-3 text-xs" />
          )}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở trang Offer</span>
          </a>
        </div>
      </div>
    </div>
  );
}
