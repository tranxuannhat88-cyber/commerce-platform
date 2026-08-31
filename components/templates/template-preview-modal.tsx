"use client";

import React, { useState } from "react";
import { X, Monitor, Tablet, Smartphone, Sparkles, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { StoreTemplate, Store, TemplateLicense } from "@/types";
import { TemplateEngine } from "@/components/storefront/templates/template-engine";
import { DEMO_STORE_DATASET } from "@/lib/templates/definitions";
import { formatVND } from "@/lib/utils";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: StoreTemplate | null;
  isOwned: boolean;
  onApply: (template: StoreTemplate) => void;
  onPurchase: (template: StoreTemplate) => void;
}

type DeviceMode = "DESKTOP" | "TABLET" | "MOBILE";

export function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
  isOwned,
  onApply,
  onPurchase,
}: TemplatePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("DESKTOP");

  if (!isOpen || !template) return null;

  const isFree = template.pricing_type === "FREE" || template.price === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full h-[95vh] max-w-7xl bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-16 px-6 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between shrink-0">
          {/* Left: Template Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{template.name}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isFree ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {isFree ? "MIỄN PHÍ" : `${formatVND(template.price)} (MUA 1 LẦN)`}
              </span>
            </div>
            {isOwned && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Đã sở hữu</span>
              </span>
            )}
          </div>

          {/* Center: Device Viewport Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-800 rounded-xl border border-neutral-700/60">
            <button
              onClick={() => setDeviceMode("DESKTOP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === "DESKTOP" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden md:inline">Máy tính</span>
            </button>
            <button
              onClick={() => setDeviceMode("TABLET")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === "TABLET" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden md:inline">Máy tính bảng</span>
            </button>
            <button
              onClick={() => setDeviceMode("MOBILE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === "MOBILE" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Điện thoại</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {isOwned || isFree ? (
              <button
                onClick={() => {
                  onApply(template);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Mẫu Này</span>
              </button>
            ) : (
              <button
                onClick={() => onPurchase(template)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>MUA MẪU – 200.000đ</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Frame Container */}
        <div className="flex-1 bg-neutral-950 p-4 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div
            className={`transition-all duration-300 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden border border-neutral-800 ${
              deviceMode === "DESKTOP"
                ? "w-full max-w-6xl min-h-[700px]"
                : deviceMode === "TABLET"
                ? "w-[768px] min-h-[700px]"
                : "w-[390px] min-h-[680px] ring-8 ring-neutral-800 rounded-[40px]"
            }`}
          >
            {/* Template Engine Demo Rendering */}
            <TemplateEngine
              template={template}
              store={DEMO_STORE_DATASET.store as Store}
              organization={DEMO_STORE_DATASET.organization}
              categories={DEMO_STORE_DATASET.categories}
              products={DEMO_STORE_DATASET.products}
              offers={DEMO_STORE_DATASET.offers}
              storeSlug="demo-nova"
              isDemoPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
