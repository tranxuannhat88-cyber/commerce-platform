"use client";

import React, { useState } from "react";
import { X, Sparkles, Check, Eye, ShieldCheck, Tag, ShoppingBag, ArrowRight } from "lucide-react";
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
  const [confirmTemplate, setConfirmTemplate] = useState<StoreTemplate | null>(null);

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

  const handleApplyClick = (template: StoreTemplate) => {
    // Show safety confirmation
    setConfirmTemplate(template);
  };

  const handleConfirmApply = () => {
    if (confirmTemplate) {
      onSelectTemplate(confirmTemplate);
      setConfirmTemplate(null);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Chọn Mẫu Cho Trang Cửa Hàng
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Bạn có thể thay đổi mẫu bất cứ lúc nào mà không ảnh hưởng đến sản phẩm hoặc đơn hàng.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "ALL"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              Tất Cả ({STORE_TEMPLATES.length})
            </button>
            <button
              onClick={() => setActiveFilter("OWNED")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "OWNED"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              Đã Sở Hữu
            </button>
            <button
              onClick={() => setActiveFilter("FREE")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "FREE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              }`}
            >
              Miễn Phí (10)
            </button>
            <button
              onClick={() => setActiveFilter("PAID")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === "PAID"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              }`}
            >
              Cao Cấp (5)
            </button>
          </div>

          {/* Templates Grid List */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => {
              const isOwned = TemplateEntitlementService.isTemplateOwnedByActor({
                template: tpl,
                actorId,
                licenses,
              });
              const isCurrent = tpl.id === currentTemplateId || tpl.code === currentTemplateId;
              const isFree = tpl.pricing_type === "FREE" || tpl.price === 0;

              return (
                <div
                  key={tpl.id}
                  className={`group bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    isCurrent
                      ? "ring-2 ring-blue-600 border-blue-600 shadow-md"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-lg"
                  }`}
                >
                  <div>
                    {/* Visual Card Header */}
                    <div className="relative aspect-16/10 bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 p-5 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between z-10">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            isFree
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-amber-500 text-neutral-950 font-black shadow-xs"
                          }`}
                        >
                          {isFree ? "MIỄN PHÍ" : `${formatVND(tpl.price)}`}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3" />
                            <span>Đang dùng</span>
                          </span>
                        )}
                      </div>

                      <div className="z-10 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          {tpl.category}
                        </p>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                          {tpl.name}
                        </h3>
                      </div>

                      {/* Subtle background decoration */}
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-20 bg-linear-to-tr from-blue-500 to-indigo-500 blur-xl" />
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>

                      <div className="space-y-1 pt-1">
                        {tpl.features.slice(0, 2).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => onOpenPreview(tpl)}
                      className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Trước</span>
                    </button>

                    {isOwned || isFree ? (
                      <button
                        onClick={() => handleApplyClick(tpl)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        }`}
                      >
                        {isCurrent ? <span>Đang Dùng</span> : <span>Áp Dụng</span>}
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPurchase(tpl)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Mua Mẫu</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Thay đổi mẫu sang &quot;{confirmTemplate.name}&quot;?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Sản phẩm, Offer, đơn hàng, cấu hình thanh toán và dữ liệu cửa hàng của bạn sẽ <strong>không bị thay đổi</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmTemplate(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApply}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Áp Dụng Mẫu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
