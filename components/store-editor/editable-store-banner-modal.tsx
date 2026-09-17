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
} from "lucide-react";
import {
  CoverPositionSettings,
  DeviceCoverSettings,
  CoverFitMode,
  DEFAULT_COVER_POSITION,
  DEFAULT_DEVICE_COVER_SETTINGS,
} from "./types";

interface EditableStoreBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string;
  currentCoverPosition?: CoverPositionSettings;
  storeName: string;
  brandColor: string;
  accentColor: string;
  onSelectBanner: (url: string, position?: CoverPositionSettings) => void;
  onDeleteBanner: () => void;
}

type DeviceTab = "desktop" | "tablet" | "mobile";

export function EditableStoreBannerModal({
  isOpen,
  onClose,
  currentBannerUrl,
  currentCoverPosition,
  storeName,
  brandColor,
  accentColor,
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
    desktop: { ...(currentCoverPosition?.desktop || DEFAULT_COVER_POSITION.desktop) },
    tablet: { ...(currentCoverPosition?.tablet || DEFAULT_COVER_POSITION.tablet) },
    mobile: { ...(currentCoverPosition?.mobile || DEFAULT_COVER_POSITION.mobile) },
  }));

  // Low resolution warning
  const [isLowRes, setIsLowRes] = useState(false);

  // Dragging interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);

  // Sync state when modal opens or props update
  useEffect(() => {
    if (isOpen) {
      setImageUrl(currentBannerUrl || "");
      setPositions({
        desktop: { ...(currentCoverPosition?.desktop || DEFAULT_COVER_POSITION.desktop) },
        tablet: { ...(currentCoverPosition?.tablet || DEFAULT_COVER_POSITION.tablet) },
        mobile: { ...(currentCoverPosition?.mobile || DEFAULT_COVER_POSITION.mobile) },
      });
      setIsLowRes(false);
      setActiveDevice("desktop");
    }
  }, [isOpen, currentBannerUrl, currentCoverPosition]);

  // Check image resolution on image change
  useEffect(() => {
    if (!imageUrl) {
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
    img.src = imageUrl;
  }, [imageUrl]);

  if (!isOpen) return null;

  // Current active device setting
  const currentSetting: DeviceCoverSettings = positions[activeDevice] || DEFAULT_DEVICE_COVER_SETTINGS;

  // Update setting for active device
  const updateActiveSetting = (updater: (prev: DeviceCoverSettings) => DeviceCoverSettings) => {
    setPositions((prev) => ({
      ...prev,
      [activeDevice]: updater(prev[activeDevice] || DEFAULT_DEVICE_COVER_SETTINGS),
    }));
  };

  // 1. File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Kích thước ảnh bìa tối đa là 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setImageUrl(result);
        setPositions({
          desktop: { ...DEFAULT_DEVICE_COVER_SETTINGS },
          tablet: { ...DEFAULT_DEVICE_COVER_SETTINGS },
          mobile: { ...DEFAULT_DEVICE_COVER_SETTINGS },
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 2. Drag Positioning Handlers (Mouse & Touch)
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!imageUrl) return;
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
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width || 1;
    const containerH = rect.height || 1;

    const deltaX = clientX - dragStartRef.current.clientX;
    const deltaY = clientY - dragStartRef.current.clientY;

    const pctX = (deltaX / containerW) * 100;
    const pctY = (deltaY / containerH) * 100;

    const newX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + pctX)));
    const newY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + pctY)));

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

  // 3. Zoom Handlers
  const handleZoomChange = (newScale: number) => {
    const clamped = Math.max(1, Math.min(3, Math.round(newScale * 100) / 100));
    updateActiveSetting((prev) => ({ ...prev, scale: clamped }));
  };

  // 4. Fit Mode Handler
  const handleFitModeChange = (mode: CoverFitMode) => {
    updateActiveSetting((prev) => ({ ...prev, fit_mode: mode }));
  };

  // 5. Center Button
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
  const handleSave = () => {
    if (!imageUrl) return;
    onSelectBanner(imageUrl, positions);
    onClose();
  };

  const getViewportDimensions = () => {
    switch (activeDevice) {
      case "mobile":
        return "w-[280px] sm:w-[320px] h-32 sm:h-36";
      case "tablet":
        return "w-full max-w-[560px] h-40 sm:h-44";
      case "desktop":
      default:
        return "w-full h-44 sm:h-52";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
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
                <span>Máy tính</span>
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
                <span>Máy tính bảng</span>
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
                <span>Di động</span>
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

          {/* 3. Interactive Preview Canvas Frame */}
          <div className="p-3 sm:p-4 rounded-3xl bg-neutral-100/80 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center min-h-[220px]">
            {imageUrl ? (
              <div
                ref={containerRef}
                className={`${getViewportDimensions()} rounded-2xl relative overflow-hidden bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-md select-none touch-none ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
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
                  src={imageUrl}
                  alt={storeName}
                  draggable={false}
                  className="w-full h-full pointer-events-none"
                  style={{
                    objectFit: currentSetting.fit_mode === "CONTAIN" ? "contain" : "cover",
                    transform: `translate(${currentSetting.x}%, ${currentSetting.y}%) scale(${currentSetting.scale})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                />

                {/* Safe Area Overlay Guide */}
                <div className="absolute inset-2.5 sm:inset-4 border border-dashed border-white/50 rounded-xl pointer-events-none flex items-end justify-center pb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold tracking-wide shadow-xs">
                    Đặt nội dung quan trọng trong vùng an toàn
                  </span>
                </div>

                {/* Drag hint badge */}
                <div className="absolute top-2.5 left-2.5 pointer-events-none px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-xs text-white/80 text-[10px] font-medium flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  <span>Kéo để chỉnh vị trí</span>
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

          {/* Low Resolution Notice */}
          {isLowRes && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Ảnh có độ phân giải thấp, có thể hiển thị không sắc nét trên ảnh bìa.</span>
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
                  onClick={() => {
                    onDeleteBanner();
                    setImageUrl("");
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl border border-red-200/70 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa ảnh bìa</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 font-medium underline underline-offset-2 cursor-pointer"
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
            className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={!imageUrl}
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#00B894] hover:bg-[#00a884] text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu vị trí ảnh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
