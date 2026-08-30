"use client";

import React, { useState } from "react";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { UserIdentity } from "@/lib/auth/types";

interface WelcomeNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (name: string) => void;
  user: UserIdentity;
}

export function WelcomeNameModal({ isOpen, onClose, onFinish, user }: WelcomeNameModalProps) {
  const { updateUserProfile } = useCommerceStore();
  const [fullName, setFullName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fullName.trim() || "Thành Viên";
    updateUserProfile({ full_name: finalName });
    onFinish(finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold mx-auto shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Chào Mừng Bạn!
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Bạn muốn chúng tôi gọi bạn là gì trong các giao dịch?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Họ và tên của bạn
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                required
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base sm:text-sm font-semibold rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Tên này sẽ hiển thị trên đơn hàng, báo giá và hóa đơn của bạn.
            </p>
          </div>

          <button
            type="submit"
            disabled={!fullName.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <span>HOÀN TẤT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
