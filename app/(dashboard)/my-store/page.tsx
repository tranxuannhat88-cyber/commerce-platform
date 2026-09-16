"use client";

import React, { useState, useEffect } from "react";
import { useCommerceStore } from "@/lib/db/store";
import { AppUrlService } from "@/lib/services/url";
import { QRModal } from "@/components/shared/qr-modal";
import { PublicStoreView } from "@/components/storefront/public/public-store-view";
import { StoreEditorHeader } from "@/components/store-editor/store-editor-header";
import { StoreBrowserBar } from "@/components/store-editor/store-browser-bar";
import { StoreCustomizationPanel } from "@/components/store-editor/store-customization-panel";
import { StoreEditorCustomization, PreviewDevice } from "@/components/store-editor/types";
import { TemplateSelectorModal } from "@/components/templates/template-selector-modal";
import { STORE_TEMPLATES } from "@/lib/templates/definitions";
import { StoreTemplate } from "@/types";

export default function MyStoreLiveEditorPage() {
  const {
    store,
    updateStore,
    currentContext,
    templateLicenses,
    applyStoreTemplate,
  } = useCommerceStore();

  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("DESKTOP");
  const [showQR, setShowQR] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const slug = store.slug || "invamax-workspace";
  const storeName = store.store_name || "INVAMAX workspace";
  const storeUrl = AppUrlService.getPublicStoreUrl(slug);

  // Find active template details
  const activeTemplate =
    STORE_TEMPLATES.find((t) => t.id === store.active_template_id) ||
    STORE_TEMPLATES.find((t) => t.code === "FREE_MODERN") ||
    STORE_TEMPLATES[0];

  // Local editor customization state (instant live preview)
  const [customization, setCustomization] = useState<StoreEditorCustomization>({
    logo_url: store.logo_url || "",
    cover_image_url: store.cover_image_url || store.customization?.hero_banner_url || "",
    brand_color: store.customization?.brand_color || "#00BB94",
    accent_color: store.customization?.accent_color || "#0F172A",
    primary_cta_text: "Xem sản phẩm",
    secondary_cta_text: "Liên hệ ngay",
    visible_sections: {
      categories: store.customization?.visible_sections?.categories !== false,
      featured_products: store.customization?.visible_sections?.products !== false,
      about: store.customization?.visible_sections?.about !== false,
      contact: store.customization?.visible_sections?.contact !== false,
      reviews: store.customization?.visible_sections?.reviews !== false,
      policies: store.customization?.visible_sections?.policies !== false,
      offers: store.customization?.visible_sections?.featured_offers !== false,
    },
    active_template_id: activeTemplate.id,
    active_template_name: activeTemplate.name,
    is_premium_template: activeTemplate.pricing_type === "PAID",
  });

  // Sync state if store updates from server
  useEffect(() => {
    setCustomization((prev) => ({
      ...prev,
      logo_url: store.logo_url || prev.logo_url,
      cover_image_url:
        store.cover_image_url || store.customization?.hero_banner_url || prev.cover_image_url,
      brand_color: store.customization?.brand_color || prev.brand_color,
      accent_color: store.customization?.accent_color || prev.accent_color,
    }));
  }, [store.logo_url, store.cover_image_url, store.customization]);

  const handleUpdate = (
    updater: (prev: StoreEditorCustomization) => StoreEditorCustomization
  ) => {
    setCustomization(updater);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedStore = {
        ...store,
        logo_url: customization.logo_url,
        cover_image_url: customization.cover_image_url,
        customization: {
          ...(store.customization || {}),
          brand_color: customization.brand_color,
          accent_color: customization.accent_color,
          hero_banner_url: customization.cover_image_url,
          visible_sections: {
            categories: customization.visible_sections.categories,
            products: customization.visible_sections.featured_products,
            about: customization.visible_sections.about,
            contact: customization.visible_sections.contact,
            reviews: customization.visible_sections.reviews,
            policies: customization.visible_sections.policies !== false,
            featured_offers: customization.visible_sections.offers !== false,
          },
        },
        active_template_id: customization.active_template_id,
        updated_at: new Date().toISOString(),
      };

      updateStore(updatedStore);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to save customization:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultTpl = STORE_TEMPLATES.find((t) => t.id === customization.active_template_id) || activeTemplate;
    setCustomization((prev) => ({
      ...prev,
      brand_color: defaultTpl.design_tokens.color_palette_default.primary || "#00BB94",
      accent_color: defaultTpl.design_tokens.color_palette_default.accent || "#0F172A",
      visible_sections: {
        categories: true,
        featured_products: true,
        about: true,
        contact: true,
        reviews: true,
        policies: true,
        offers: true,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSelectTemplate = (template: StoreTemplate) => {
    setCustomization((prev) => ({
      ...prev,
      active_template_id: template.id,
      active_template_name: template.name,
      is_premium_template: template.pricing_type === "PAID",
      brand_color: template.design_tokens.color_palette_default.primary || prev.brand_color,
      accent_color: template.design_tokens.color_palette_default.accent || prev.accent_color,
    }));
    setHasUnsavedChanges(true);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* 1. TOP HEADER & TOOLBAR */}
      <StoreEditorHeader
        previewDevice={previewDevice}
        onDeviceChange={setPreviewDevice}
        onShare={() => setShowQR(true)}
        publicStoreUrl={storeUrl}
      />

      {/* 2. THREE-ZONE ARCHITECTURE: CENTER PREVIEW + RIGHT CUSTOMIZATION PANEL */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* CENTER: LIVE STOREFRONT VIEWPORT */}
        <div className="flex-1 min-w-0 w-full space-y-3">
          {/* Browser Bar */}
          <StoreBrowserBar
            storeUrl={storeUrl}
            templateName={customization.active_template_name}
            isPremium={customization.is_premium_template}
            onChangeTemplate={() => setShowTemplates(true)}
          />

          {/* Live Storefront Frame */}
          {previewDevice === "DESKTOP" ? (
            <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs bg-white dark:bg-neutral-950 transition-all">
              <PublicStoreView
                storeSlug={slug}
                customizationOverrides={{
                  logoUrl: customization.logo_url,
                  coverImageUrl: customization.cover_image_url,
                  brandColor: customization.brand_color,
                  accentColor: customization.accent_color,
                  primaryCtaText: customization.primary_cta_text,
                  secondaryCtaText: customization.secondary_cta_text,
                  visibleSections: customization.visible_sections,
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center py-6 bg-neutral-100/70 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 transition-all">
              <div className="w-[390px] max-w-full rounded-[40px] border-8 border-neutral-800 dark:border-neutral-700 shadow-2xl overflow-hidden bg-white dark:bg-neutral-950">
                {/* Simulated mobile speaker notch */}
                <div className="h-6 bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center">
                  <div className="w-16 h-1 bg-neutral-600 rounded-full" />
                </div>
                <div className="max-h-[750px] overflow-y-auto">
                  <PublicStoreView
                    storeSlug={slug}
                    customizationOverrides={{
                      logoUrl: customization.logo_url,
                      coverImageUrl: customization.cover_image_url,
                      brandColor: customization.brand_color,
                      accentColor: customization.accent_color,
                      primaryCtaText: customization.primary_cta_text,
                      secondaryCtaText: customization.secondary_cta_text,
                      visibleSections: customization.visible_sections,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: QUICK CUSTOMIZATION PANEL */}
        <StoreCustomizationPanel
          customization={customization}
          storeName={storeName}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onUpdate={handleUpdate}
          onSave={handleSave}
          onReset={handleReset}
          onOpenTemplates={() => setShowTemplates(true)}
        />
      </div>

      {/* 3. QR & SHARE MODAL */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={storeUrl}
        title={storeName}
      />

      {/* 4. TEMPLATE SELECTOR MODAL */}
      <TemplateSelectorModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        currentTemplateId={customization.active_template_id}
        currentContext={currentContext}
        licenses={templateLicenses || []}
        onSelectTemplate={handleSelectTemplate}
        onOpenPreview={(tpl) => handleSelectTemplate(tpl)}
        onOpenPurchase={(tpl) => {
          handleSelectTemplate(tpl);
        }}
      />
    </div>
  );
}