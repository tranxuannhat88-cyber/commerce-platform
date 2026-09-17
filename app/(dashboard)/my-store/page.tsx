"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommerceStore } from "@/lib/db/store";
import { AppUrlService } from "@/lib/services/url";
import { QRModal } from "@/components/shared/qr-modal";
import { PublicStoreView } from "@/components/storefront/public/public-store-view";
import { StoreEditorHeader } from "@/components/store-editor/store-editor-header";
import { StoreCustomizationPanel } from "@/components/store-editor/store-customization-panel";
import { EditableStoreLogoModal } from "@/components/store-editor/editable-store-logo-modal";
import { EditableStoreBannerModal } from "@/components/store-editor/editable-store-banner-modal";
import {
  StoreEditorCustomization,
  PreviewDevice,
  CoverPositionSettings,
  DEFAULT_COVER_POSITION,
} from "@/components/store-editor/types";
import { TemplateSelectorModal } from "@/components/templates/template-selector-modal";
import { STORE_TEMPLATES } from "@/lib/templates/definitions";
import { Store, StoreTemplate } from "@/types";
import { SyncBridgeService } from "@/lib/db/sync-bridge";

export default function MyStoreLiveEditorPage() {
  const router = useRouter();
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
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
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
    cover_position: store.cover_position || store.customization?.cover_position || DEFAULT_COVER_POSITION,
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
      cover_position: store.cover_position || store.customization?.cover_position || prev.cover_position,
      brand_color: store.customization?.brand_color || prev.brand_color,
      accent_color: store.customization?.accent_color || prev.accent_color,
    }));
  }, [store.logo_url, store.cover_image_url, store.cover_position, store.customization]);

  const handleUpdate = (
    updater: (prev: StoreEditorCustomization) => StoreEditorCustomization
  ) => {
    setCustomization(updater);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedStore: Store = {
        ...store,
        logo_url: customization.logo_url !== undefined ? customization.logo_url : store.logo_url,
        logo_asset_id: store.logo_asset_id,
        cover_image_url: customization.cover_image_url !== undefined ? customization.cover_image_url : store.cover_image_url,
        cover_asset_id: store.cover_asset_id,
        cover_position: customization.cover_position || store.cover_position,
        customization: {
          ...(store.customization || {}),
          brand_color: customization.brand_color,
          accent_color: customization.accent_color,
          hero_banner_url: customization.cover_image_url,
          cover_position: customization.cover_position,
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
      await SyncBridgeService.syncStoreToServer(updatedStore);
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
      logo_url: store.logo_url || "",
      cover_image_url: store.cover_image_url || "",
      cover_position: DEFAULT_COVER_POSITION,
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

  // Direct In-Storefront Handlers with Immediate Persistence
  const handleSelectLogo = async (url: string, assetId?: string) => {
    setCustomization((prev) => ({ ...prev, logo_url: url }));
    const updatedStore: Store = {
      ...store,
      logo_url: url,
      logo_asset_id: assetId || store.logo_asset_id,
      updated_at: new Date().toISOString(),
    };
    updateStore(updatedStore);
    await SyncBridgeService.syncStoreToServer(updatedStore);
    setHasUnsavedChanges(false);
  };

  const handleDeleteLogo = async () => {
    setCustomization((prev) => ({ ...prev, logo_url: "" }));
    const updatedStore: Store = {
      ...store,
      logo_url: "",
      logo_asset_id: undefined,
      updated_at: new Date().toISOString(),
    };
    updateStore(updatedStore);
    await SyncBridgeService.syncStoreToServer(updatedStore);
    setHasUnsavedChanges(false);
  };

  const handleSelectBanner = async (
    url: string,
    position?: CoverPositionSettings,
    assetId?: string
  ) => {
    const pos = position || customization.cover_position || store.cover_position;
    setCustomization((prev) => ({
      ...prev,
      cover_image_url: url,
      cover_position: pos,
    }));
    const updatedStore: Store = {
      ...store,
      cover_image_url: url,
      cover_asset_id: assetId || store.cover_asset_id,
      cover_position: pos,
      customization: {
        ...(store.customization || {}),
        hero_banner_url: url,
        cover_position: pos,
      },
      updated_at: new Date().toISOString(),
    };
    updateStore(updatedStore);
    await SyncBridgeService.syncStoreToServer(updatedStore);
    setHasUnsavedChanges(false);
  };

  const handleDeleteBanner = async () => {
    setCustomization((prev) => ({ ...prev, cover_image_url: "" }));
    const updatedStore: Store = {
      ...store,
      cover_image_url: "",
      cover_asset_id: undefined,
      customization: {
        ...(store.customization || {}),
        hero_banner_url: "",
      },
      updated_at: new Date().toISOString(),
    };
    updateStore(updatedStore);
    await SyncBridgeService.syncStoreToServer(updatedStore);
    setHasUnsavedChanges(false);
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
        <div className="flex-1 min-w-0 w-full">
          {/* Live Storefront Frame (What You See Is What You Edit) */}
          {previewDevice === "DESKTOP" && (
            <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs bg-white dark:bg-neutral-950 transition-all">
              <PublicStoreView
                storeSlug={slug}
                customizationOverrides={{
                  logoUrl: customization.logo_url,
                  coverImageUrl: customization.cover_image_url,
                  coverPosition: customization.cover_position,
                  previewDevice: "DESKTOP",
                  brandColor: customization.brand_color,
                  accentColor: customization.accent_color,
                  primaryCtaText: customization.primary_cta_text,
                  secondaryCtaText: customization.secondary_cta_text,
                  visibleSections: customization.visible_sections,
                  isEditable: true,
                  onEditLogo: () => setShowLogoModal(true),
                  onEditBanner: () => setShowBannerModal(true),
                  onEditStoreInfo: () => router.push("/store-settings"),
                }}
              />
            </div>
          )}

          {previewDevice === "TABLET" && (
            <div className="flex justify-center py-6 bg-neutral-100/70 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 transition-all p-2 sm:p-4">
              <div className="w-[768px] md:w-[820px] max-w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 shadow-xl overflow-hidden bg-white dark:bg-neutral-950">
                <PublicStoreView
                  storeSlug={slug}
                  customizationOverrides={{
                    logoUrl: customization.logo_url,
                    coverImageUrl: customization.cover_image_url,
                    coverPosition: customization.cover_position,
                    previewDevice: "TABLET",
                    brandColor: customization.brand_color,
                    accentColor: customization.accent_color,
                    primaryCtaText: customization.primary_cta_text,
                    secondaryCtaText: customization.secondary_cta_text,
                    visibleSections: customization.visible_sections,
                    isEditable: true,
                    onEditLogo: () => setShowLogoModal(true),
                    onEditBanner: () => setShowBannerModal(true),
                    onEditStoreInfo: () => router.push("/store-settings"),
                  }}
                />
              </div>
            </div>
          )}

          {previewDevice === "MOBILE" && (
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
                      coverPosition: customization.cover_position,
                      previewDevice: "MOBILE",
                      brandColor: customization.brand_color,
                      accentColor: customization.accent_color,
                      primaryCtaText: customization.primary_cta_text,
                      secondaryCtaText: customization.secondary_cta_text,
                      visibleSections: customization.visible_sections,
                      isEditable: true,
                      onEditLogo: () => setShowLogoModal(true),
                      onEditBanner: () => setShowBannerModal(true),
                      onEditStoreInfo: () => router.push("/store-settings"),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: STREAMLINED CUSTOMIZATION PANEL (NO LOGO/BANNER, COLLAPSIBLE) */}
        <StoreCustomizationPanel
          customization={customization}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          isOpen={isPanelOpen}
          onToggleOpen={() => setIsPanelOpen(!isPanelOpen)}
          onUpdate={handleUpdate}
          onSave={handleSave}
          onReset={handleReset}
          activeTemplateName={customization.active_template_name}
          isPremiumTemplate={customization.is_premium_template}
          templatePrice={activeTemplate?.price}
          onChangeTemplate={() => setShowTemplates(true)}
        />
      </div>

      {/* 3. DIRECT EDITING MODALS */}
      <EditableStoreLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        currentLogoUrl={customization.logo_url}
        storeName={storeName}
        brandColor={customization.brand_color}
        storeId={store.id || "store_invamax_workspace"}
        onSelectLogo={handleSelectLogo}
        onDeleteLogo={handleDeleteLogo}
      />

      <EditableStoreBannerModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        currentBannerUrl={customization.cover_image_url}
        currentCoverPosition={customization.cover_position}
        storeName={storeName}
        brandColor={customization.brand_color}
        accentColor={customization.accent_color}
        storeId={store.id || "store_invamax_workspace"}
        onSelectBanner={handleSelectBanner}
        onDeleteBanner={handleDeleteBanner}
      />

      {/* 4. QR & SHARE MODAL */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={storeUrl}
        title={storeName}
      />

      {/* 5. TEMPLATE SELECTOR MODAL */}
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