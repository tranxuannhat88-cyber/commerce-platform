"use client";

import React from "react";
import { Users, X, Sparkles, Building2, ArrowRight } from "lucide-react";

interface PersonalTeamNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrg: () => void;
}

export function PersonalTeamNoticeModal({
  isOpen,
  onClose,
  onCreateOrg,
}: PersonalTeamNoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Bạn đang ở hình thức CÁ NHÂN
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <p>
            Hình thức <strong>CÁ NHÂN</strong> được thiết kế tối ưu cho <strong>một người tự quản lý và vận hành</strong>. Bạn có đầy đủ khả năng tạo cửa hàng, đăng bán sản phẩm, phát hành offer và giao dịch.
          </p>
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Cần thêm nhân viên & phân quyền?</span>
            </p>
            <p className="text-[11px] text-blue-800 dark:text-blue-300">
              Hãy tạo <strong>TỔ CHỨC</strong> để mời đồng nghiệp, phân quyền vai trò (Sales, Kho, Kế toán) và quản lý nhiều chi nhánh cửa hàng.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs transition-colors"
          >
            Đã hiểu
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateOrg();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tạo Tổ Chức Ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
