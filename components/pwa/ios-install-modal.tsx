"use client";

import { Share2, PlusSquare, X, Smartphone, Check } from "lucide-react";
import { PWA_CONFIG } from "@/lib/config/pwa";

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Thêm Vào Màn Hình Chính (iOS)
              </h3>
              <p className="text-[11px] text-slate-500">{PWA_CONFIG.APP_SHORT_NAME}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
          <p className="text-slate-500 dark:text-slate-400">
            Để mở ứng dụng toàn màn hình không có thanh URL như Native App, vui lòng làm theo 3 bước:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Bấm nút Chia sẻ</span>
                  <Share2 className="w-4 h-4 text-blue-600" />
                </p>
                <p className="text-[11px] text-slate-500">
                  Nằm ở thanh công cụ dưới đáy trình duyệt Safari trên iPhone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Chọn &quot;Thêm vào MH chính&quot;</span>
                  <PlusSquare className="w-4 h-4 text-emerald-600" />
                </p>
                <p className="text-[11px] text-slate-500">
                  Cuộn xuống danh sách tùy chọn và chọn <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Nhấn nút &quot;Thêm&quot; (Add)</span>
                  <Check className="w-4 h-4 text-emerald-600" />
                </p>
                <p className="text-[11px] text-slate-500">
                  Nút ở góc trên cùng bên phải để hoàn tất tạo icon ứng dụng.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          Tôi đã hiểu
        </button>
      </div>
    </div>
  );
}
