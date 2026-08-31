"use client";

import React, { useState } from "react";
import { Sparkles, Palette, Layout, Eye, Save, CheckCircle2, Sliders, ArrowRight } from "lucide-react";
import { Store, StoreTemplate, StoreCustomizationSettings, TemplateLicense, WorkContext } from "@/types";
import { STORE_TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/templates/definitions";
import { TemplateSelectorModal } from "./template-selector-modal";
import { TemplatePreviewModal } from "./template-preview-modal";
import { TemplatePurchaseModal } from "./template-purchase-modal";

interface StoreCustomizerProps {
  store: Store;
  currentContext: WorkContext;
  licenses: TemplateLicense[];
  onUpdateCustomization: (customization: Partial<StoreCustomizationSettings>) => void;
  onApplyTemplate: (templateId: string) => Promise<boolean>;
  onPurchaseTemplate: (templateId: string, price?: number) => Promise<TemplateLicense>;
}

const PRESET_COLORS = [
  { name: "Xanh Dương (Chuẩn)", primary: "#2563eb", accent: "#3b82f6" },
  { name: "Tím Sang Trọng", primary: "#7c3aed", accent: "#8b5cf6" },
  { name: "Xanh Lục Tự Nhiên", primary: "#059669", accent: "#10b981" },
  { name: "Cam Năng Động", primary: "#ea580c", accent: "#f97316" },
  { name: "Đỏ Quyến Rũ", primary: "#dc2626", accent: "#ef4444" },
  { name: "Đen Tinh Tế", primary: "#18181b", accent: "#71717a" },
];

export function StoreCustomizer({
  store,
  currentContext,
  licenses,
  onUpdateCustomization,
  onApplyTemplate,
  onPurchaseTemplate,
}: StoreCustomizerProps) {
  const currentTemplate =
    STORE_TEMPLATES.find((t) => t.id === store.active_template_id || t.code === store.active_template_id) ||
    STORE_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ||
    STORE_TEMPLATES[0];

  const [brandColor, setBrandColor] = useState(
    store.customization?.brand_color || currentTemplate.design_tokens.color_palette_default.primary
  );
  const [accentColor, setAccentColor] = useState(
    store.customization?.accent_color || currentTemplate.design_tokens.color_palette_default.accent
  );
  const [heroTitle, setHeroTitle] = useState(store.customization?.hero_title || store.store_name || "");
  const [heroSubtitle, setHeroSubtitle] = useState(store.customization?.hero_subtitle || store.description || "");

  const [visibleSections, setVisibleSections] = useState({
    hero: store.customization?.visible_sections?.hero !== false,
    trust_bar: store.customization?.visible_sections?.trust_bar !== false,
    categories: store.customization?.visible_sections?.categories !== false,
    featured_offers: store.customization?.visible_sections?.featured_offers !== false,
    products: store.customization?.visible_sections?.products !== false,
    services: store.customization?.visible_sections?.services !== false,
    about: store.customization?.visible_sections?.about !== false,
    contact: store.customization?.visible_sections?.contact !== false,
  });

  const [isSaved, setIsSaved] = useState(false);

  // Modals state
  const [showSelector, setShowSelector] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<StoreTemplate | null>(null);
  const [purchaseTemplate, setPurchaseTemplate] = useState<StoreTemplate | null>(null);

  const handleSave = () => {
    onUpdateCustomization({
      brand_color: brandColor,
      accent_color: accentColor,
      hero_title: heroTitle.trim() || undefined,
      hero_subtitle: heroSubtitle.trim() || undefined,
      visible_sections: visibleSections,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isCurrentOwned = currentTemplate.pricing_type === "FREE" || licenses.some(
    (l) => (l.template_id === currentTemplate.id || l.template_code === currentTemplate.code) && l.actor_id === currentContext.actor_id && l.status === "ACTIVE"
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* 1. CURRENT ACTIVE TEMPLATE CARD */}
      <div className="p-6 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>MẪU GIAO DIỆN HIỆN TẠI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentTemplate.name}</h2>
          <p className="text-xs text-blue-100 max-w-xl leading-relaxed">{currentTemplate.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setPreviewTemplate(currentTemplate)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Xem Trước Live</span>
          </button>
          <button
            onClick={() => setShowSelector(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layout className="w-4 h-4 text-blue-600" />
            <span>Thay Đổi Mẫu Giao Diện</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* 2. BRAND COLOR CUSTOMIZATION */}
        <div className="lg:col-span-6 p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Màu Sắc Thương Hiệu</h3>
              <p className="text-[11px] text-neutral-400">Chọn bảng màu đồng bộ cho nút bấm, viền và điểm nhấn</p>
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Bảng màu gợi ý:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_COLORS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBrandColor(preset.primary);
                    setAccentColor(preset.accent);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    brandColor === preset.primary
                      ? "border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full shadow-inner shrink-0" style={{ backgroundColor: preset.primary }} />
                  <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Inputs */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Màu chủ đạo (Primary):</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Màu điểm nhấn (Accent):</label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION VISIBILITY CONTROLS */}
        <div className="lg:col-span-6 p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Bật / Tắt Các Khối Hiển Thị</h3>
              <p className="text-[11px] text-neutral-400">Ẩn hoặc hiện các phần nội dung trên trang cửa hàng của bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: "hero", label: "Banner Hero (Đầu trang)" },
              { id: "trust_bar", label: "Thanh Uy Tín (Trust Bar)" },
              { id: "featured_offers", label: "Ưu Đãi & Bảng Giá HOT" },
              { id: "categories", label: "Bộ Lọc Danh Mục" },
              { id: "products", label: "Lưới Sản Phẩm" },
              { id: "about", label: "Về Chúng Tôi" },
              { id: "contact", label: "Thông Tin Liên Hệ" },
            ].map((sec) => (
              <label
                key={sec.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleSections[sec.id as keyof typeof visibleSections] !== false}
                  onChange={(e) =>
                    setVisibleSections({
                      ...visibleSections,
                      [sec.id]: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded-md border-neutral-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{sec.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SAVE ACTION BAR */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {isSaved ? (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu tùy biến thành công!</span>
            </span>
          ) : (
            <span>Nhớ bấm Lưu Thiết Lập sau khi hoàn tất chỉnh sửa màu sắc và bố cục.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewTemplate(currentTemplate)}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Xem Trước
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Tùy Biến</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      <TemplateSelectorModal
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        currentTemplateId={store.active_template_id}
        currentContext={currentContext}
        licenses={licenses}
        onSelectTemplate={(tpl) => onApplyTemplate(tpl.id)}
        onOpenPreview={(tpl) => setPreviewTemplate(tpl)}
        onOpenPurchase={(tpl) => setPurchaseTemplate(tpl)}
      />

      <TemplatePreviewModal
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
        isOwned={isCurrentOwned}
        onApply={(tpl) => onApplyTemplate(tpl.id)}
        onPurchase={(tpl) => {
          setPreviewTemplate(null);
          setPurchaseTemplate(tpl);
        }}
      />

      <TemplatePurchaseModal
        isOpen={Boolean(purchaseTemplate)}
        onClose={() => setPurchaseTemplate(null)}
        template={purchaseTemplate}
        currentContext={currentContext}
        onConfirmPayment={async (tpl) => {
          await onPurchaseTemplate(tpl.id, tpl.price);
          await onApplyTemplate(tpl.id);
        }}
      />
    </div>
  );
}
