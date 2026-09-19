"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Trash2,
  Camera,
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlignCenter,
  Check,
  AlertTriangle,
  Move,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import {
  CoverPositionSettings,
  DeviceCoverSettings,
  CoverFitMode,
  DEFAULT_COVER_POSITION,
  DEFAULT_DEVICE_COVER_SETTINGS,
  STORE_COVER_RATIOS,
  StoreCoverDevice,
} from "./types";
import { uploadMediaFile } from "@/lib/storage/upload-client";

interface EditableStoreBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string;
  currentCoverPosition?: CoverPositionSettings;
  storeName: string;
  brandColor: string;
  accentColor: string;
  storeId?: string;
  onSelectBanner: (url: string, position?: CoverPositionSettings, assetId?: string) => Promise<void> | void;
  onDeleteBanner: () => Promise<void> | void;
}

type DeviceTab = "desktop" | "tablet" | "mobile";

const normalizeDeviceSetting = (setting?: Partial<DeviceCoverSettings>): DeviceCoverSettings => ({
  scale: setting?.scale ?? 1,
  x: setting?.x ?? 0,
  y: setting?.y ?? 0,
  fit_mode: setting?.fit_mode || "CONTAIN",
  image_url: setting?.image_url,
  asset_id: setting?.asset_id,
});

export function EditableStoreBannerModal({
  isOpen,
  onClose,
  currentBannerUrl,
  currentCoverPosition,
  storeName,
  brandColor,
  accentColor,
  storeId = "store_invamax_workspace",
  onSelectBanner,
  onDeleteBanner,
}: EditableStoreBannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Device Tab: "desktop" | "tablet" | "mobile"
  const [activeDevice, setActiveDevice] = useState<DeviceTab>("desktop");

  // Local image URL (either existing or freshly uploaded)
  const [imageUrl, setImageUrl] = useState<string>(currentBannerUrl || "");

  // Positions for all 3 devices
  const [positions, setPositions] = useState<CoverPositionSettings>(() => ({
    desktop: normalizeDeviceSetting(currentCoverPosition?.desktop),
    tablet: normalizeDeviceSetting(currentCoverPosition?.tablet),
    mobile: normalizeDeviceSetting(currentCoverPosition?.mobile),
  }));

  // Low resolution warning
  const [isLowRes, setIsLowRes] = useState(false);

  // Uploading and Saving states
  const [isUploading, setIsUploading] = useState(false);
  const [isDeviceUploading, setIsDeviceUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<{ url: string; assetId: string } | null>(null);
  const deviceFileInputRef = useRef<HTMLInputElement>(null);

  // Dragging interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);
  const prevIsOpenRef = useRef(false);

  // Sync state ONLY when modal opens (transition from closed to open)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setImageUrl(currentBannerUrl || "");
      setPositions({
        desktop: normalizeDeviceSetting(currentCoverPosition?.desktop),
        tablet: normalizeDeviceSetting(currentCoverPosition?.tablet),
        mobile: normalizeDeviceSetting(currentCoverPosition?.mobile),
      });
      setIsLowRes(false);
      setActiveDevice("desktop");
      setIsUploading(false);
      setIsDeviceUploading(false);
      setIsSaving(false);
      setUploadError(null);
      setUploadedAsset(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Current active device setting
  const currentSetting: DeviceCoverSettings = positions[activeDevice] || DEFAULT_DEVICE_COVER_SETTINGS;
  const activeDeviceImageUrl = currentSetting.image_url || imageUrl;
  const hasDeviceCustomImage = Boolean(currentSetting.image_url && currentSetting.image_url !== imageUrl);

  // Check image resolution on image change
  useEffect(() => {
    if (!activeDeviceImageUrl) {
      setIsLowRes(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 1200 || img.naturalHeight < 300) {
        setIsLowRes(true);
      } else {
        setIsLowRes(false);
      }
    };
    img.src = activeDeviceImageUrl;
  }, [activeDeviceImageUrl]);

  if (!isOpen) return null;

  // Update setting for active device
  const updateActiveSetting = (updater: (prev: DeviceCoverSettings) => DeviceCoverSettings) => {
    setPositions((prev) => ({
      ...prev,
      [activeDevice]: updater(prev[activeDevice] || DEFAULT_DEVICE_COVER_SETTINGS),
    }));
  };

  // Device-Specific Image Handler
  const handleDeviceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      setUploadError("Chỉ chấp nhận tệp hình ảnh định dạng PNG, JPG hoặc WEBP.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Kích thước ảnh bìa tối đa là 15MB.");
      return;
    }

    setUploadError(null);
    setIsDeviceUploading(true);

    try {
      const asset = await uploadMediaFile(file, {
        ownerType: "STORE",
        ownerId: storeId,
        visibility: "PUBLIC",
      });

      const updatedSetting: DeviceCoverSettings = {
        scale: 1,
        x: 0,
        y: 0,
        fit_mode: "CONTAIN",
        image_url: asset.url,
        asset_id: asset.assetId,
      };

      const updatedPositions = {
        ...positions,
        [activeDevice]: updatedSetting,
      };
      setPositions(updatedPositions);

      // Immediately sync to store
      await onSelectBanner(imageUrl || asset.url, updatedPositions, uploadedAsset?.assetId || asset.assetId);
    } catch (err: any) {
      console.error("Device banner upload error:", err);
      setUploadError(err.message || "Không thể tải ảnh riêng cho thiết bị. Vui lòng thử lại.");
    } finally {
      setIsDeviceUploading(false);
      if (deviceFileInputRef.current) deviceFileInputRef.current.value = "";
    }
  };

  const handleRemoveDeviceSpecificImage = async () => {
    const updatedSetting: DeviceCoverSettings = {
      ...currentSetting,
      scale: 1,
      x: 0,
      y: 0,
      fit_mode: "CONTAIN",
    };
    delete updatedSetting.image_url;
    delete updatedSetting.asset_id;

    const updatedPositions = {
      ...positions,
      [activeDevice]: updatedSetting,
    };
    setPositions(updatedPositions);

    if (imageUrl) {
      await onSelectBanner(imageUrl, updatedPositions, uploadedAsset?.assetId);
    }
  };

  // 1. File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      setUploadError("Chỉ chấp nhận tệp hình ảnh định dạng PNG, JPG hoặc WEBP.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Kích thước ảnh bìa tối đa là 15MB.");
      return;
    }

    setUploadError(null);
    const tempUrl = URL.createObjectURL(file);
    setImageUrl(tempUrl);
    const initialPositions: CoverPositionSettings = {
      desktop: { scale: 1, x: 0, y: 0, fit_mode: "CONTAIN" },
      tablet: { scale: 1, x: 0, y: 0, fit_mode: "CONTAIN" },
      mobile: { scale: 1, x: 0, y: 0, fit_mode: "CONTAIN" },
    };
    setPositions(initialPositions);

    setIsUploading(true);

    try {
      const asset = await uploadMediaFile(file, {
        ownerType: "STORE",
        ownerId: storeId,
        visibility: "PUBLIC",
      });

      // Switch to permanent URL
      setImageUrl(asset.url);
      setUploadedAsset({ url: asset.url, assetId: asset.assetId });

      // Step 1: Immediately persist image reference to Store
      await onSelectBanner(asset.url, initialPositions, asset.assetId);
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setUploadError(err.message || "Không thể tải ảnh lên máy chủ lưu trữ. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(tempUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 2. Drag Positioning Handlers (Mouse & Touch)
  const isDraggable = (currentSetting.fit_mode || "CONTAIN").toUpperCase() === "COVER" || (currentSetting.scale ?? 1) > 1;

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!activeDeviceImageUrl || !isDraggable) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX,
      clientY,
      initialX: currentSetting.x,
      initialY: currentSetting.y,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;

    const deltaX = clientX - dragStartRef.current.clientX;
    const deltaY = clientY - dragStartRef.current.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Convert pixels to percentage of container bounds
    const deltaXPct = (deltaX / rect.width) * 100;
    const deltaYPct = (deltaY / rect.height) * 100;

    const newX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + deltaXPct)));
    const newY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + deltaYPct)));

    updateActiveSetting((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // 3. Zoom Slider Handler
  const handleZoomChange = (newScale: number) => {
    const clampedScale = Math.max(1, Math.min(3, Number(newScale.toFixed(2))));
    updateActiveSetting((prev) => ({
      ...prev,
      scale: clampedScale,
    }));
  };

  // 4. Fit Mode Handler
  const handleFitModeChange = (mode: CoverFitMode) => {
    updateActiveSetting((prev) => ({
      ...prev,
      fit_mode: mode,
      ...(mode === "CONTAIN" ? { scale: 1, x: 0, y: 0 } : {}),
    }));
  };

  // 5. Center Button Handler
  const handleCenter = () => {
    updateActiveSetting((prev) => ({ ...prev, x: 0, y: 0 }));
  };

  // 6. Reset Current Device Button
  const handleResetCurrent = () => {
    updateActiveSetting(() => ({ ...DEFAULT_DEVICE_COVER_SETTINGS }));
  };

  // 7. Reset All Devices Button
  const handleResetAll = () => {
    setPositions({
      desktop: { ...DEFAULT_DEVICE_COVER_SETTINGS },
      tablet: { ...DEFAULT_DEVICE_COVER_SETTINGS },
      mobile: { ...DEFAULT_DEVICE_COVER_SETTINGS },
    });
  };

  // 8. Save Handler
  const handleSave = async () => {
    if (!imageUrl && !positions.desktop.image_url) return;
    setIsSaving(true);
    setUploadError(null);

    try {
      const finalUrl = uploadedAsset?.url || imageUrl || positions.desktop.image_url || "";
      const finalAssetId = uploadedAsset?.assetId || positions.desktop.asset_id;

      await onSelectBanner(finalUrl, positions, finalAssetId);
      onClose();
    } catch (err: any) {
      console.error("Failed to save banner:", err);
      setUploadError(err.message || "Ảnh đã tải lên nhưng chưa thể lưu vào cửa hàng. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);
      await onDeleteBanner();
      setImageUrl("");
      setUploadedAsset(null);
      setPositions({
        desktop: { ...DEFAULT_DEVICE_COVER_SETTINGS },
        tablet: { ...DEFAULT_DEVICE_COVER_SETTINGS },
        mobile: { ...DEFAULT_DEVICE_COVER_SETTINGS },
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to delete banner:", err);
      setUploadError(err.message || "Không thể xóa ảnh bìa. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const getViewportDimensions = () => {
    switch (activeDevice) {
      case "mobile":
        return `w-[260px] sm:w-[280px] ${STORE_COVER_RATIOS.mobile.aspectClass}`;
      case "tablet":
        return `w-full ${STORE_COVER_RATIOS.tablet.previewMaxWidth} ${STORE_COVER_RATIOS.tablet.aspectClass}`;
      case "desktop":
      default:
        return `w-full ${STORE_COVER_RATIOS.desktop.previewMaxWidth} ${STORE_COVER_RATIOS.desktop.aspectClass}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-3xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* 1. Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00B894]/10 text-[#00B894] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                Điều chỉnh ảnh bìa
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Thu phóng, kéo chọn vùng hiển thị và xem trước theo từng thiết bị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* 2. Device Mode Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveDevice("desktop")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeDevice === "desktop"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/60 dark:border-neutral-700"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-[#00B894]" />
                  <span>Máy tính (8:3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDevice("tablet")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeDevice === "tablet"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/60 dark:border-neutral-700"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5 text-[#00B894]" />
                  <span>Máy tính bảng (16:7)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDevice("mobile")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeDevice === "mobile"
                      ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs border border-neutral-200/60 dark:border-neutral-700"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#00B894]" />
                  <span>Di động (4:3)</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={handleCenter}
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Căn giữa hình ảnh"
                >
                  <AlignCenter className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Căn giữa</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCurrent}
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Đặt lại thiết bị này về mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Ratio info & recommended size */}
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 px-1">
              <span>
                Tỷ lệ chuẩn: <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{STORE_COVER_RATIOS[activeDevice].label}</strong> • Kích thước khuyến nghị: <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{STORE_COVER_RATIOS[activeDevice].recommendedSize}</strong>
              </span>
              {activeDevice !== "desktop" && (
                <span className="text-[10px] text-neutral-400 italic hidden sm:inline">
                  {hasDeviceCustomImage ? "(Đang dùng ảnh riêng)" : "(Dùng chung ảnh bìa gốc)"}
                </span>
              )}
            </div>
          </div>

          {/* 3. Interactive Preview Canvas Frame */}
          <div className="p-3 sm:p-4 rounded-3xl bg-neutral-100/80 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center min-h-[220px]">
            {activeDeviceImageUrl ? (
              <div
                ref={containerRef}
                className={`${getViewportDimensions()} rounded-2xl relative overflow-hidden bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-md select-none touch-none ${
                  isDraggable ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
                }`}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={(e) => {
                  if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={handlePointerUp}
              >
                {/* Banner Image with Live Transforms */}
                <img
                  src={activeDeviceImageUrl}
                  alt={storeName}
                  draggable={false}
                  className="w-full h-full pointer-events-none select-none"
                  style={{
                    objectFit: (currentSetting.fit_mode || "CONTAIN").toUpperCase() === "CONTAIN" ? "contain" : "cover",
                    transform: `translate(${currentSetting.x ?? 0}%, ${currentSetting.y ?? 0}%) scale(${currentSetting.scale ?? 1})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                />

                {/* Safe Area Overlay Guide - Only show when in COVER mode or zoomed */}
                {((currentSetting.fit_mode || "CONTAIN").toUpperCase() === "COVER" || (currentSetting.scale ?? 1) > 1) && (
                  <div className={`absolute ${STORE_COVER_RATIOS[activeDevice].safeAreaClass} border border-dashed border-white/50 rounded-xl pointer-events-none flex items-end justify-center pb-1.5 animate-in fade-in`}>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold tracking-wide shadow-xs">
                      Vùng an toàn ({STORE_COVER_RATIOS[activeDevice].label})
                    </span>
                  </div>
                )}

                {/* Drag hint badge */}
                <div className="absolute top-2.5 left-2.5 pointer-events-none px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-xs text-white/80 text-[10px] font-medium flex items-center gap-1">
                  {currentSetting.fit_mode === "CONTAIN" && (currentSetting.scale ?? 1) <= 1 ? (
                    <>
                      <Minimize2 className="w-3 h-3 text-[#00B894]" />
                      <span>Hiển thị toàn bộ ảnh (không cắt)</span>
                    </>
                  ) : (
                    <>
                      <Move className="w-3 h-3" />
                      <span>Kéo để chỉnh vị trí</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="w-full h-44 rounded-2xl flex flex-col items-center justify-center gap-2 text-neutral-500 border-2 border-dashed border-neutral-300 dark:border-neutral-700"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}15 0%, ${accentColor}30 100%)`,
                }}
              >
                <Camera className="w-8 h-8 text-neutral-400" />
                <span className="text-xs font-bold">Chưa có ảnh bìa cửa hàng</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Tải ảnh lên ngay
                </button>
              </div>
            )}
          </div>

          {/* Device-Specific Image Card (Tablet / Mobile) */}
          {activeDevice !== "desktop" && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 text-xs border border-neutral-200/60 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                  {hasDeviceCustomImage
                    ? `Thiết bị này đang dùng ảnh riêng (${STORE_COVER_RATIOS[activeDevice].label})`
                    : `Tùy chọn: Dùng ảnh riêng phù hợp tỷ lệ ${STORE_COVER_RATIOS[activeDevice].label}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasDeviceCustomImage ? (
                  <>
                    <button
                      type="button"
                      onClick={() => deviceFileInputRef.current?.click()}
                      disabled={isSaving || isUploading || isDeviceUploading}
                      className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      {isDeviceUploading ? "Đang tải..." : "Đổi ảnh riêng"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveDeviceSpecificImage}
                      disabled={isSaving || isUploading || isDeviceUploading}
                      className="px-2.5 py-1 rounded-lg text-neutral-500 hover:text-red-600 dark:hover:text-red-400 font-bold text-[11px] cursor-pointer transition-colors underline"
                    >
                      Dùng lại ảnh chung
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => deviceFileInputRef.current?.click()}
                    disabled={isSaving || isUploading || isDeviceUploading}
                    className="px-2.5 py-1 rounded-lg bg-[#00B894]/10 hover:bg-[#00B894]/20 text-[#00B894] font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isDeviceUploading ? "Đang tải..." : "Dùng ảnh riêng cho thiết bị này"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Low Resolution Notice */}
          {isLowRes && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Ảnh có độ phân giải thấp, có thể hiển thị không sắc nét trên ảnh bìa.</span>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* 4. Controls: Fit Mode + Zoom Slider */}
          {imageUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
              {/* Fit Mode Toggle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Cách hiển thị ảnh
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => handleFitModeChange("CONTAIN")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentSetting.fit_mode === "CONTAIN"
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    <Minimize2 className="w-3 h-3 text-[#00B894]" />
                    <span>Hiển thị toàn ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFitModeChange("COVER")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      currentSetting.fit_mode === "COVER"
                        ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    <Maximize2 className="w-3 h-3 text-[#00B894]" />
                    <span>Lấp đầy khung</span>
                  </button>
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  <span>Thu phóng</span>
                  <span className="text-[#00B894] font-mono font-bold text-xs">
                    {Math.round(currentSetting.scale * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleZoomChange(currentSetting.scale - 0.1)}
                    disabled={currentSetting.scale <= 1}
                    className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={currentSetting.scale}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00B894]"
                  />
                  <button
                    type="button"
                    onClick={() => handleZoomChange(currentSetting.scale + 0.1)}
                    disabled={currentSetting.scale >= 3}
                    className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Upload File Input & Image Management */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <input
            type="file"
            ref={deviceFileInputRef}
            onChange={handleDeviceFileChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-500" />
                <span>{imageUrl ? "Tải ảnh khác" : "Tải ảnh lên"}</span>
              </button>

              {imageUrl && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || isUploading || isDeviceUploading}
                  className="px-3 py-1.5 rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa ảnh bìa</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              disabled={isSaving || isUploading || isDeviceUploading}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-medium underline underline-offset-2 cursor-pointer disabled:opacity-40"
            >
              Đặt lại tất cả thiết bị
            </button>
          </div>
        </div>

        {/* 6. Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2.5 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isUploading || isDeviceUploading}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={(!imageUrl && !positions.desktop.image_url) || isSaving || isUploading || isDeviceUploading}
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {isSaving || isUploading || isDeviceUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isUploading || isDeviceUploading ? "Đang tải ảnh..." : "Đang lưu..."}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu vị trí ảnh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
