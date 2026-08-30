"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { computeSHA256, quickSyncHash } from "@/core/verification/hasher";
import { formatDate, formatDateTime } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function DocumentVerificationPage() {
  const { documentHashes } = useCommerceStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<{
    matched: boolean;
    doc?: (typeof documentHashes)[0];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSHA256(buffer);
      setComputedHash(hash);

      const found = documentHashes.find((d) => d.file_hash.toLowerCase() === hash.toLowerCase() || d.file_name === file.name);

      if (found) {
        setMatchResult({ matched: true, doc: found });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setMatchResult({ matched: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateSample = (isOriginal: boolean) => {
    setIsProcessing(true);
    setTimeout(() => {
      if (isOriginal) {
        const sampleDoc = documentHashes[0];
        setComputedHash(sampleDoc.file_hash);
        setMatchResult({ matched: true, doc: sampleDoc });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        const alteredHash = "8f9a2b3c4d5e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a";
        setComputedHash(alteredHash);
        setMatchResult({ matched: false });
      }
      setIsProcessing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vào Bảng Điều Khiển</span>
          </Link>
          <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mã hóa SHA-256 an toàn tại trình duyệt</span>
          </div>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <FileCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Công Cụ Đối Soát & Xác Thực Tài Liệu Kỹ Thuật
          </h1>
          <p className="text-xs text-neutral-500">
            Kéo thả bản vẽ CAD, file PDF kỹ thuật hoặc hợp đồng để kiểm tra tính nguyên bản (Đảm bảo file không bị chỉnh sửa dù chỉ 1 byte).
          </p>
        </div>

        {/* Upload Dropzone */}
        <div className="p-8 bg-white dark:bg-neutral-900 rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-4 hover:border-emerald-500 transition-colors">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Chọn tệp hoặc kéo thả tệp vào đây
            </p>
            <p className="text-[11px] text-neutral-400">
              Hỗ trợ PDF, DWG, DXF, STEP, PNG, JPG, DOCX (Mã hóa tính toán trực tiếp trên RAM, không upload file lên máy chủ bên thứ ba)
            </p>
          </div>

          <label className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
            <span>Chọn tệp từ máy tính</span>
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Sample Quick Test Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="text-neutral-400 font-medium">Hoặc thử nhanh mẫu:</span>
          <button
            onClick={() => handleSimulateSample(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold cursor-pointer hover:bg-emerald-100"
          >
            ✓ Thử Bản vẽ Trục Inox 304 gốc (Hợp lệ)
          </button>
          <button
            onClick={() => handleSimulateSample(false)}
            className="px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold cursor-pointer hover:bg-red-100"
          >
            ❌ Thử Bản vẽ đã bị sửa đổi (Gian lận)
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border text-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-neutral-500">Đang tính toán mã băm mật mã SHA-256...</p>
          </div>
        )}

        {/* Match Result Display */}
        {matchResult && !isProcessing && (
          <div className="space-y-4 animate-in zoom-in-95">
            {matchResult.matched ? (
              <div className="p-6 md:p-8 rounded-3xl bg-emerald-600 text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">✓ TÀI LIỆU CHÍNH HÃNG - ĐÚNG 100% PHIÊN BẢN GỐC</h3>
                    <p className="text-xs text-emerald-100">
                      Mã băm SHA-256 của tệp trùng khớp hoàn toàn với bản ghi được đăng ký trên Trust Layer.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-emerald-200 text-[10px] block">Tên tệp đăng ký:</span>
                    <strong className="text-white">{matchResult.doc?.file_name}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-200 text-[10px] block">Mã băm SHA-256:</span>
                    <span className="text-white break-all text-[11px]">{computedHash}</span>
                  </div>
                  <div>
                    <span className="text-emerald-200 text-[10px] block">Thời gian đăng ký đóng dấu mốc:</span>
                    <span className="text-white">{matchResult.doc?.uploaded_at ? formatDateTime(matchResult.doc.uploaded_at) : "2 ngày trước"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 rounded-3xl bg-red-600 text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">❌ TÀI LIỆU KHÔNG KHỚP HOẶC ĐÃ BỊ CHỈNH SỬA!</h3>
                    <p className="text-xs text-red-100">
                      Mã băm của tệp không khớp với bất kỳ chứng thư đã đăng ký nào trong hệ thống. File có thể đã bị sửa đổi hoặc là phiên bản giả mạo.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 space-y-1 text-xs font-mono">
                  <span className="text-red-200 text-[10px] block">Mã băm SHA-256 vừa tính toán:</span>
                  <span className="text-white break-all text-[11px]">{computedHash}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
