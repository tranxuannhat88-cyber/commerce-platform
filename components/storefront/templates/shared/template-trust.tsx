"use client";

import React from "react";
import { ShieldCheck, Lock, QrCode, RefreshCw, Award, CheckCircle2 } from "lucide-react";
import { StoreTemplate } from "@/types";

interface TemplateTrustProps {
  template: StoreTemplate;
  brandColor?: string;
  accentColor?: string;
}

export function TemplateTrust({
  template,
  brandColor = "#2563eb",
  accentColor = "#3b82f6",
}: TemplateTrustProps) {
  return (
    <section className="py-8 bg-neutral-50 dark:bg-neutral-900/60 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Thanh Toán VietQR</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Mã QR Napas247 chính xác tuyệt đối, bảo mật qua hệ thống ngân hàng.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Doanh Nghiệp Xác Thực</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Hồ sơ pháp lý minh bạch, chứng thực chữ ký số an toàn.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Bảo Vệ Đơn Hàng</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Tra cứu tiến độ giao hàng và xác nhận biên bản bàn giao điện tử.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Chính Sách Uy Tín</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Cam kết hàng chính hãng 100%, bảo hành đổi trả rõ ràng.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
