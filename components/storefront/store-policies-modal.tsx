"use client";

import React, { useState } from "react";
import {
  X,
  Truck,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { StorePolicySettings } from "@/types";

interface StorePoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: StorePolicySettings;
  storeName: string;
  initialTab?: "shipping" | "returns" | "warranty" | "payment";
}

export function StorePoliciesModal({
  isOpen,
  onClose,
  policies,
  storeName,
  initialTab = "shipping",
}: StorePoliciesModalProps) {
  const [activeTab, setActiveTab] = useState<"shipping" | "returns" | "warranty" | "payment">(
    initialTab
  );

  if (!isOpen) return null;

  const tabs = [
    { id: "shipping" as const, label: "Vận Chuyển", icon: Truck },
    { id: "returns" as const, label: "Đổi Trả", icon: RotateCcw },
    { id: "warranty" as const, label: "Bảo Hành", icon: ShieldCheck },
    { id: "payment" as const, label: "Thanh Toán", icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
            <FileText className="w-3 h-3" />
            <span>CHÍNH SÁCH BÁN HÀNG</span>
          </div>
          <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
            Quy Định Mua Hàng & Cam Kết
          </h3>
          <p className="text-xs text-neutral-500">Cung cấp bởi {storeName}</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 min-h-[140px] text-xs text-neutral-700 dark:text-neutral-300 space-y-3">
          {activeTab === "shipping" && (
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Chính Sách Vận Chuyển & Giao Nhận</span>
              </h4>
              <p className="leading-relaxed">
                {policies.shipping_policy || "Giao hàng toàn quốc. Hỗ trợ kiểm tra hàng trước khi nhận."}
              </p>
              {policies.processing_time && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian chuẩn bị: {policies.processing_time}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "returns" && (
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Chính Sách Đổi Trả & Hoàn Tiền</span>
              </h4>
              <p className="leading-relaxed">
                {policies.return_policy || "Đổi trả miễn phí trong 7 ngày nếu lỗi từ nhà sản xuất."}
              </p>
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Chính Sách Bảo Hành & Bảo Trì</span>
              </h4>
              <p className="leading-relaxed">
                {policies.warranty_policy || "Bảo hành chính hãng 12 - 24 tháng theo tiêu chuẩn."}
              </p>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-2">
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Quy Định Thanh Toán & Hóa Đơn</span>
              </h4>
              <p className="leading-relaxed">
                {policies.payment_terms || "Hỗ trợ thanh toán VietQR tự động, COD và hóa đơn GTGT điện tử."}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          ĐÃ HIỂU & ĐÓNG
        </button>
      </div>
    </div>
  );
}
