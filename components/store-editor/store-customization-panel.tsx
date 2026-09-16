"use client";

import React from "react";
import {
  Palette,
  Check,
  ChevronDown,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { StoreEditorCustomization } from "./types";

interface StoreCustomizationPanelProps {
  customization: StoreEditorCustomization;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdate: (updater: (prev: StoreEditorCustomization) => StoreEditorCustomization) => void;
  onSave: () => void;
  onReset: () => void;
}

export function StoreCustomizationPanel({
  customization,
  isSaving,
  hasUnsavedChanges,
  isOpen,
  onToggleOpen,
  onUpdate,
  onSave,
  onReset,
}: StoreCustomizationPanelProps) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="fixed bottom-6 right-6 z-40 lg:static lg:bottom-auto lg:right-auto px-4 py-2.5 rounded-2xl bg-[#00B894] hover:bg-[#00a884] text-white text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        title="Mở bảng tùy chỉnh giao diện"
      >
        <Palette className="w-4 h-4" />
        <span>› Tùy chỉnh giao diện</span>
      </button>
    );
  }

  return (
    <aside className="w-full lg:w-[290px] xl:w-[310px] shrink-0 space-y-3 transition-all animate-in fade-in">
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00B894]/10 text-[#00B894] flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                TÙY CHỈNH GIAO DIỆN
              </h2>
              <p className="text-[10px] text-neutral-400">Màu sắc, hiển thị & nút hành động</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleOpen}
            className="w-6 h-6 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Thu gọn panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MÀU THƯƠNG HIỆU */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00B894]" />
            <span>Màu thương hiệu</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Primary Color */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Màu chính
              </label>
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <input
                  type="color"
                  value={customization.brand_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, brand_color: e.target.value }))
                  }
                  className="w-5 h-5 rounded-lg border-0 p-0 cursor-pointer overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={customization.brand_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, brand_color: e.target.value }))
                  }
                  className="w-full text-[11px] font-mono font-bold uppercase bg-transparent outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Màu phụ
              </label>
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <input
                  type="color"
                  value={customization.accent_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, accent_color: e.target.value }))
                  }
                  className="w-5 h-5 rounded-lg border-0 p-0 cursor-pointer overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={customization.accent_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, accent_color: e.target.value }))
                  }
                  className="w-full text-[11px] font-mono font-bold uppercase bg-transparent outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. HIỂN THỊ NỘI DUNG */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
            <span>Hiển thị nội dung</span>
            <span className="text-[10px] font-normal text-neutral-400">Bật/tắt section</span>
          </div>
          <div className="space-y-2 text-xs">
            {[
              {
                id: "categories" as const,
                label: "Danh mục sản phẩm",
              },
              {
                id: "featured_products" as const,
                label: "Sản phẩm nổi bật",
              },
              {
                id: "about" as const,
                label: "Section Giới thiệu",
              },
              {
                id: "contact" as const,
                label: "Thông tin liên hệ",
              },
              {
                id: "reviews" as const,
                label: "Đánh giá & uy tín",
              },
            ].map((sec) => {
              const isChecked = customization.visible_sections[sec.id] !== false;
              return (
                <label
                  key={sec.id}
                  className="flex items-center justify-between cursor-pointer py-0.5 select-none"
                >
                  <span className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                    {sec.label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    onClick={() =>
                      onUpdate((prev) => ({
                        ...prev,
                        visible_sections: {
                          ...prev.visible_sections,
                          [sec.id]: !isChecked,
                        },
                      }))
                    }
                    className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                      isChecked ? "bg-[#00B894]" : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-2xs ${
                        isChecked ? "translate-x-3.5" : ""
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. NÚT HÀNH ĐỘNG (CTA) */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Nút hành động (CTA)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Primary CTA */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-bold">Nút chính</label>
              <div className="relative">
                <select
                  value={customization.primary_cta_text}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      primary_cta_text: e.target.value,
                    }))
                  }
                  className="w-full text-[11px] font-medium py-1.5 pl-2 pr-5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 appearance-none outline-none cursor-pointer"
                >
                  <option value="Xem sản phẩm">Xem sản phẩm</option>
                  <option value="Mua ngay">Mua ngay</option>
                  <option value="Liên hệ">Liên hệ</option>
                  <option value="Yêu cầu báo giá">Báo giá</option>
                  <option value="Xem Offer">Xem Offer</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-bold">Nút phụ</label>
              <div className="relative">
                <select
                  value={customization.secondary_cta_text}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      secondary_cta_text: e.target.value,
                    }))
                  }
                  className="w-full text-[11px] font-medium py-1.5 pl-2 pr-5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 appearance-none outline-none cursor-pointer"
                >
                  <option value="Liên hệ ngay">Liên hệ</option>
                  <option value="Xem giới thiệu">Giới thiệu</option>
                  <option value="Chia sẻ">Chia sẻ</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. ACTIONS & SAVE */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          {hasUnsavedChanges && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold text-amber-800 dark:text-amber-200 flex items-center justify-between gap-1 animate-in fade-in">
              <span>Có thay đổi chưa lưu</span>
              <button
                type="button"
                onClick={onReset}
                className="underline hover:text-amber-950 dark:hover:text-white cursor-pointer"
              >
                Khôi phục
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-[#00B894] hover:bg-[#00a884] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}