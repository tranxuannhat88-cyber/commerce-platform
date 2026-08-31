"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Check,
  Eye,
  ShieldCheck,
  Tag,
  ShoppingBag,
  ArrowRight,
  Layout,
  Layers,
  Store as StoreIcon,
  Crown,
  Grid,
  Zap,
  Star,
  CheckCircle2,
} from "lucide-react";
import { StoreTemplate, WorkContext, TemplateLicense } from "@/types";
import { STORE_TEMPLATES } from "@/lib/templates/definitions";
import { TemplateEntitlementService } from "@/lib/templates/entitlement";
import { formatVND } from "@/lib/utils";

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  currentContext: WorkContext;
  licenses: TemplateLicense[];
  onSelectTemplate: (template: StoreTemplate) => void;
  onOpenPreview: (template: StoreTemplate) => void;
  onOpenPurchase: (template: StoreTemplate) => void;
}

type FilterTab = "ALL" | "OWNED" | "FREE" | "PAID";

// Mini Wireframe Layout Illustrator for each template style
function TemplateWireframePreview({ template }: { template: StoreTemplate }) {
  const primary = template.design_tokens.color_palette_default.primary;
  const accent = template.design_tokens.color_palette_default.accent;
  const layout = template.design_tokens.hero_layout;

  return (
    <div className="w-full h-28 rounded-xl bg-neutral-900/95 p-3 flex flex-col justify-between border border-white/10 shadow-inner overflow-hidden select-none">
      {/* Top wireframe header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            ★
          </div>
          <div className="w-14 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-1.5 rounded-full bg-white/20" />
          <div className="w-5 h-1.5 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
        </div>
      </div>

      {/* Hero layout visualizer */}
      {layout === "split" ? (
        <div className="grid grid-cols-12 gap-2 py-1 items-center">
          <div className="col-span-7 space-y-1">
            <div className="w-20 h-2 rounded-xs" style={{ backgroundColor: primary }} />
            <div className="w-24 h-1.5 rounded-xs bg-white/30" />
            <div className="w-12 h-3 rounded-md mt-1 shadow-xs" style={{ backgroundColor: accent }} />
          </div>
          <div className="col-span-5 h-10 rounded-lg bg-white/15 border border-white/10 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white/50" />
          </div>
        </div>
      ) : layout === "banner" ? (
        <div
          className="relative h-10 rounded-lg overflow-hidden p-2 flex flex-col justify-center border border-white/10 shadow-xs"
          style={{ background: `linear-gradient(135deg, ${primary}dd, #111827)` }}
        >
          <div className="w-20 h-2 rounded-xs bg-white font-bold" />
          <div className="w-28 h-1.5 rounded-xs bg-white/50 mt-1" />
        </div>
      ) : layout === "storytelling" ? (
        <div className="h-10 rounded-lg flex flex-col items-center justify-center text-center space-y-1 border border-white/10 bg-white/5">
          <div className="w-24 h-2 rounded-xs font-serif" style={{ backgroundColor: accent }} />
          <div className="w-32 h-1.5 rounded-xs bg-white/30" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 py-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 rounded-md bg-white/10 border border-white/5 flex flex-col justify-end p-1 space-y-1"
            >
              <div className="w-full h-4 rounded-xs bg-white/20" />
              <div className="w-3/4 h-1.5 rounded-xs" style={{ backgroundColor: primary }} />
            </div>
          ))}
        </div>
      )}

      {/* Mini footer indicator */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] text-white/50">
        <span className="font-bold">{template.name}</span>
        <span className="font-mono uppercase">{template.category}</span>
      </div>
    </div>
  );
}

export function TemplateSelectorModal({
  isOpen,
  onClose,
  currentTemplateId = "tpl_free_minimal",
  currentContext,
  licenses,
  onSelectTemplate,
  onOpenPreview,
  onOpenPurchase,
}: TemplateSelectorModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  if (!isOpen) return null;

  const actorId = currentContext.actor_id;

  const filteredTemplates = STORE_TEMPLATES.filter((tpl) => {
    const isOwned = TemplateEntitlementService.isTemplateOwnedByActor({
      template: tpl,
      actorId,
      licenses,
    });

    if (activeFilter === "FREE") return tpl.pricing_type === "FREE" || tpl.price === 0;
    if (activeFilter === "PAID") return tpl.pricing_type === "PAID";
    if (activeFilter === "OWNED") return isOwned;
    return true;
  });

  const handleApplyNow = (template: StoreTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="relative w-full max-w-6xl h-[90vh] max-h-[920px] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200/60 dark:border-blue-900/60">
                <Layout className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Chọn Mẫu Giao Diện Cho Cửa Hàng
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1 pl-10">
              Bạn có thể tự do thay đổi mẫu giao diện bất kỳ lúc nào mà <strong>không bị mất sản phẩm, ưu đãi hay đơn hàng</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto shrink-0 bg-neutral-50/80 dark:bg-neutral-800/40">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "ALL"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Tất Cả ({STORE_TEMPLATES.length})</span>
          </button>
          <button
            onClick={() => setActiveFilter("OWNED")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "OWNED"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đã Sở Hữu</span>
          </button>
          <button
            onClick={() => setActiveFilter("FREE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "FREE"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Miễn Phí (10)</span>
          </button>
          <button
            onClick={() => setActiveFilter("PAID")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "PAID"
                ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Cao Cấp Premium (5)</span>
          </button>
        </div>

        {/* Templates Scroll Container (min-h-0 ensures vertical scroll works in flexbox!) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => {
              const isOwned = TemplateEntitlementService.isTemplateOwnedByActor({
                template: tpl,
                actorId,
                licenses,
              });
              const isCurrent = tpl.id === currentTemplateId || tpl.code === currentTemplateId;
              const isFree = tpl.pricing_type === "FREE" || tpl.price === 0;
              const primaryColor = tpl.design_tokens.color_palette_default.primary;
              const accentColor = tpl.design_tokens.color_palette_default.accent;

              return (
                <div
                  key={tpl.id}
                  className={`group bg-white dark:bg-neutral-900 rounded-3xl border flex flex-col justify-between transition-all duration-300 min-h-[410px] p-5 space-y-4 shadow-2xs hover:shadow-xl ${
                    isCurrent
                      ? "ring-2 ring-blue-600 border-blue-600 shadow-xl bg-blue-50/10 dark:bg-blue-950/20"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Visual Card Header & Wireframe */}
                    <div
                      className="rounded-2xl p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden transition-all group-hover:scale-[1.01]"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}30)`,
                        borderColor: `${primaryColor}50`,
                      }}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between z-10">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide shadow-xs flex items-center gap-1 ${
                            isFree
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-400 text-neutral-950 font-black"
                          }`}
                        >
                          {!isFree && <Crown className="w-3 h-3" />}
                          <span>{isFree ? "MIỄN PHÍ" : `${formatVND(tpl.price)}`}</span>
                        </span>

                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Đang Dùng</span>
                          </span>
                        ) : isOwned && !isFree ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                            ✓ Đã Sở Hữu
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider bg-white/80 dark:bg-neutral-800/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {tpl.category}
                          </span>
                        )}
                      </div>

                      {/* Mini Wireframe Mockup */}
                      <TemplateWireframePreview template={tpl} />
                    </div>

                    {/* Template Title & Category */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                          {tpl.name}
                        </h3>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          v{tpl.version}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 min-h-[32px]">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      {tpl.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onOpenPreview(tpl)}
                      className="flex-1 py-2.5 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-4 h-4 text-neutral-500" />
                      <span>Xem Trước</span>
                    </button>

                    {isOwned || isFree ? (
                      <button
                        type="button"
                        onClick={() => handleApplyNow(tpl)}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          isCurrent
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                            : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Đang Dùng</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Áp Dụng</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPurchase(tpl)}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Mua {formatVND(tpl.price)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
