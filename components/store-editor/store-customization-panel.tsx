"use client";

import React, { useRef } from "react";
import {
  SlidersHorizontal,
  Upload,
  Trash2,
  Check,
  ChevronDown,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { StoreEditorCustomization } from "./types";

interface StoreCustomizationPanelProps {
  customization: StoreEditorCustomization;
  storeName: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onUpdate: (updater: (prev: StoreEditorCustomization) => StoreEditorCustomization) => void;
  onSave: () => void;
  onReset: () => void;
  onOpenTemplates: () => void;
}

export function StoreCustomizationPanel({
  customization,
  storeName,
  isSaving,
  hasUnsavedChanges,
  onUpdate,
  onSave,
  onReset,
  onOpenTemplates,
}: StoreCustomizationPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Generate initials if no logo
  const initials = (storeName || "Store")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước logo tối đa là 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onUpdate((prev) => ({ ...prev, logo_url: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước banner tối đa là 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        onUpdate((prev) => ({ ...prev, cover_image_url: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-full lg:w-[340px] xl:w-[360px] shrink-0 space-y-4">
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
        {/* Panel Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="w-7 h-7 rounded-lg bg-[#00B894]/10 text-[#00B894] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Tùy chỉnh nhanh
            </h2>
            <p className="text-[11px] text-neutral-500">
              Cá nhân hóa cửa hàng theo thương hiệu của bạn.
            </p>
          </div>
        </div>

        {/* 1. STORE LOGO */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Logo cửa hàng
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#00B894] text-white flex items-center justify-center font-black text-lg overflow-hidden shrink-0 border border-neutral-200/60 shadow-2xs">
              {customization.logo_url ? (
                <img
                  src={customization.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Thay logo</span>
                </button>
                {customization.logo_url && (
                  <button
                    type="button"
                    onClick={() => onUpdate((prev) => ({ ...prev, logo_url: "" }))}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold rounded-xl border border-red-200/70 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                    title="Xóa logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                PNG, JPG, WebP (tối đa 5 MB)
                <br />
                Tỷ lệ khuyến nghị: 1:1
              </p>
            </div>
          </div>
        </div>

        {/* 2. BANNER / COVER */}
        <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Banner / Ảnh bìa
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 overflow-hidden relative group">
              {customization.cover_image_url ? (
                <img
                  src={customization.cover_image_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-medium">
                  Chưa có ảnh bìa
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                <span>Thay ảnh</span>
              </button>
              {customization.cover_image_url && (
                <button
                  type="button"
                  onClick={() => onUpdate((prev) => ({ ...prev, cover_image_url: "" }))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-red-200/70 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  title="Xóa ảnh bìa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 leading-tight">
              PNG, JPG, WebP (tối đa 10 MB)
              <br />
              Kích thước khuyến nghị: 1920 × 600
            </p>
          </div>
        </div>

        {/* 3. BRAND COLORS */}
        <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Màu thương hiệu
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-6 h-6 rounded-lg border-0 p-0 cursor-pointer overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={customization.brand_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, brand_color: e.target.value }))
                  }
                  className="w-full text-xs font-mono font-bold uppercase bg-transparent outline-none text-neutral-800 dark:text-neutral-200"
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
                  className="w-6 h-6 rounded-lg border-0 p-0 cursor-pointer overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={customization.accent_color}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, accent_color: e.target.value }))
                  }
                  className="w-full text-xs font-mono font-bold uppercase bg-transparent outline-none text-neutral-800 dark:text-neutral-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. DISPLAY SECTIONS */}
        <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Thông tin hiển thị
          </div>
          <div className="space-y-2 text-xs">
            {[
              {
                id: "categories" as const,
                label: "Hiển thị danh mục sản phẩm",
              },
              {
                id: "featured_products" as const,
                label: "Hiển thị sản phẩm nổi bật",
              },
              {
                id: "about" as const,
                label: "Hiển thị section Giới thiệu",
              },
              {
                id: "contact" as const,
                label: "Hiển thị thông tin liên hệ",
              },
              {
                id: "reviews" as const,
                label: "Hiển thị đánh giá & uy tín",
              },
            ].map((sec) => {
              const isChecked = customization.visible_sections[sec.id] !== false;
              return (
                <label
                  key={sec.id}
                  className="flex items-center justify-between cursor-pointer py-0.5 select-none"
                >
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
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
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      isChecked ? "bg-[#00B894]" : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 ${
                        isChecked ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        </div>

        {/* 5. CTA ACTIONS */}
        <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Nút hành động
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Primary CTA */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-bold">
                Văn bản nút chính
              </label>
              <div className="relative">
                <select
                  value={customization.primary_cta_text}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      primary_cta_text: e.target.value,
                    }))
                  }
                  className="w-full text-xs font-medium py-1.5 pl-2.5 pr-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 appearance-none outline-none cursor-pointer"
                >
                  <option value="Xem sản phẩm">Xem sản phẩm</option>
                  <option value="Mua ngay">Mua ngay</option>
                  <option value="Liên hệ">Liên hệ</option>
                  <option value="Yêu cầu báo giá">Yêu cầu báo giá</option>
                  <option value="Xem Offer">Xem Offer</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 font-bold">
                Văn bản nút phụ
              </label>
              <div className="relative">
                <select
                  value={customization.secondary_cta_text}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      secondary_cta_text: e.target.value,
                    }))
                  }
                  className="w-full text-xs font-medium py-1.5 pl-2.5 pr-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 appearance-none outline-none cursor-pointer"
                >
                  <option value="Liên hệ ngay">Liên hệ ngay</option>
                  <option value="Xem giới thiệu">Xem giới thiệu</option>
                  <option value="Chia sẻ">Chia sẻ</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-2.5 mt-2 rounded-xl bg-[#00B894] hover:bg-[#00a884] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu tùy chỉnh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. TEMPLATE CARD AT BOTTOM */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Đổi mẫu giao diện
          </div>
          <span className="text-[10px] font-bold text-neutral-400">15+ mẫu</span>
        </div>

        {/* Mini Preview Wireframes */}
        <div className="grid grid-cols-4 gap-1.5">
          {["Modern", "Minimal", "B2B Pro", "Dark Tech"].map((tpl, i) => (
            <div
              key={tpl}
              onClick={onOpenTemplates}
              className={`rounded-lg p-1.5 text-center border cursor-pointer transition-all ${
                i === 0
                  ? "border-[#00B894] bg-[#00B894]/5 ring-1 ring-[#00B894]"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
              }`}
            >
              <div className="w-full h-8 rounded-sm bg-neutral-100 dark:bg-neutral-800 mb-1 flex items-center justify-center">
                <LayoutGrid className="w-3 h-3 text-neutral-400" />
              </div>
              <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 truncate block">
                {tpl}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-neutral-400 leading-tight">
          Chọn từ 15+ mẫu giao diện chuyên nghiệp, phù hợp với ngành nghề của bạn.
        </p>

        <button
          type="button"
          onClick={onOpenTemplates}
          className="w-full py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[#00B894] font-bold text-xs transition-colors cursor-pointer"
        >
          Xem tất cả mẫu giao diện
        </button>
      </div>
    </aside>
  );
}