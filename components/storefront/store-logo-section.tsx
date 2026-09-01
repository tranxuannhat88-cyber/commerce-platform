"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Trash2, RefreshCw, Check, X, AlertCircle, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { MediaAsset } from "@/types";

interface StoreLogoSectionProps {
  storeId?: string;
  storeName: string;
  logoUrl?: string;
  logoAssetId?: string;
  onChange: (data: { logoUrl: string; logoAssetId: string }) => void;
  brandColor?: string;
}

export function StoreLogoSection({
  storeId = "store_current",
  storeName,
  logoUrl: initialLogoUrl = "",
  logoAssetId: initialLogoAssetId = "",
  onChange,
  brandColor = "#2563eb",
}: StoreLogoSectionProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logoAssetId, setLogoAssetId] = useState(initialLogoAssetId);

  // Crop / Upload Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setLogoUrl(initialLogoUrl || "");
    setLogoAssetId(initialLogoAssetId || "");
  }, [initialLogoUrl, initialLogoAssetId]);

  // Deterministic Initials Fallback
  const getInitials = (name: string) => {
    if (!name) return "🏬";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = "";

    // 1. Format Validation
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert("Chỉ hỗ trợ PNG, JPG và WebP.");
      return;
    }

    // 2. Size Validation (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo vượt quá dung lượng cho phép 5 MB.");
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setZoom(1);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setSelectedImageSrc(event.target.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Draw crop preview on canvas
  useEffect(() => {
    if (!cropModalOpen || !selectedImageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedImageSrc;
    img.onload = () => {
      imageObjRef.current = img;
      renderCanvas();
    };
  }, [cropModalOpen, selectedImageSrc, zoom]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !ctxRef() || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Fill neutral light background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size, size);

    // Calculate aspect ratio containment & zoom
    const imgAspect = img.width / img.height;
    let drawW = size;
    let drawH = size;

    if (imgAspect > 1) {
      drawH = size / imgAspect;
    } else {
      drawW = size * imgAspect;
    }

    // Apply user zoom
    drawW *= zoom;
    drawH *= zoom;

    const offsetX = (size - drawW) / 2;
    const offsetY = (size - drawH) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  };

  const ctxRef = () => canvasRef.current?.getContext("2d");

  const handleConfirmCropAndUpload = async () => {
    if (!canvasRef.current || !selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      // 1. Export canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob((b) => resolve(b), "image/png", 0.95);
      });

      if (!blob) {
        throw new Error("Không thể tạo dữ liệu hình ảnh");
      }

      const croppedFile = new File([blob], `logo_${Date.now()}.png`, { type: "image/png" });

      // 2. Request Presigned Upload Intent
      const intentRes = await fetch("/api/media/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_type: "STORE",
          owner_id: storeId,
          file_name: croppedFile.name,
          mime_type: "image/png",
          file_size: croppedFile.size,
          visibility: "PUBLIC",
        }),
      });

      if (!intentRes.ok) {
        const errData = await intentRes.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể khởi tạo phiên tải lên");
      }

      const intent = await intentRes.json();

      // 3. Direct Storage Upload
      const uploadRes = await fetch(intent.upload_url, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: croppedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Lỗi khi tải tệp lên Storage");
      }

      // 4. Complete Upload
      const completeRes = await fetch("/api/media/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: intent.asset_id,
          upload_intent_token: intent.upload_intent_token,
          object_key: intent.object_key,
          bucket: intent.bucket,
          owner_type: "STORE",
          owner_id: storeId,
          original_file_name: croppedFile.name,
          mime_type: "image/png",
          file_size: croppedFile.size,
          visibility: "PUBLIC",
        }),
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể hoàn tất tải lên");
      }

      const asset: MediaAsset = await completeRes.json();
      
      // Determine public URL
      const finalUrl = (asset as any).public_url || (asset.object_key.startsWith("http") ? asset.object_key : `/uploads/${asset.object_key.split("/").pop()}`);

      setLogoUrl(finalUrl);
      setLogoAssetId(asset.id);
      onChange({ logoUrl: finalUrl, logoAssetId: asset.id });

      setCropModalOpen(false);
      setSelectedImageSrc(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setUploadError("Không thể tải logo lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = () => {
    setLogoUrl("");
    setLogoAssetId("");
    onChange({ logoUrl: "", logoAssetId: "" });
    setDeleteModalOpen(false);
  };

  return (
    <div className="space-y-3 pt-1 pb-4 border-b border-neutral-200 dark:border-neutral-800">
      <div>
        <label className="block font-bold text-xs text-neutral-800 dark:text-neutral-200">
          Logo cửa hàng
        </label>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          Logo này sẽ được hiển thị trên Trang cửa hàng công khai của bạn.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* LOGO PREVIEW BOX (1:1 CONTAINER) */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName || "Store Logo"}
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <div className="w-full h-full rounded-xl flex flex-col items-center justify-center text-center p-1 bg-neutral-100 dark:bg-neutral-800/80 text-neutral-400">
              <span className="font-bold text-base text-neutral-600 dark:text-neutral-300">
                {getInitials(storeName)}
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-neutral-400 mt-1">
                Chưa có logo
              </span>
            </div>
          )}
        </div>

        {/* ACTIONS & NOTES */}
        <div className="space-y-2 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            {!logoUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải logo lên</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-xs border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Thay logo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa logo</span>
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-neutral-400">
            PNG, JPG hoặc WebP • Tối đa 5 MB
          </p>
        </div>
      </div>

      {/* 1:1 CROP & PREVIEW MODAL */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Tùy chỉnh Logo Cửa Hàng (1:1)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Xem trước và căn chỉnh kích thước logo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                disabled={isUploading}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert */}
            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{uploadError}</p>
              </div>
            )}

            {/* CANVAS PREVIEW (SQUARE 1:1) */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 overflow-hidden shadow-inner flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={512}
                  height={512}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* ZOOM CONTROLS */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <span className="flex items-center gap-1">
                  <ZoomOut className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Thu nhỏ / Phóng to</span>
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={isUploading}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmCropAndUpload}
                disabled={isUploading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ĐANG TẢI LÊN...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>XÁC NHẬN & TẢI LÊN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Xóa logo cửa hàng?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Trang cửa hàng sẽ sử dụng hình đại diện mặc định cho đến khi bạn tải logo mới.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-500/20 cursor-pointer"
              >
                XÓA LOGO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
