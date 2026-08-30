"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";

export default function OfflineFallbackPage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500 shadow-lg shadow-amber-500/10">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mất Kết Nối Internet</span>
          </span>
          <h1 className="text-xl font-black text-white tracking-tight">
            Bạn Đang Ngoại Tuyến
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Không thể tải dữ liệu mới từ máy chủ. Vui lòng kiểm tra lại đường truyền Wi-Fi hoặc dữ liệu di động (4G/5G) trên thiết bị của bạn.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left text-xs space-y-1.5 text-slate-300">
          <p className="font-bold text-slate-200">💡 Lưu ý an toàn giao dịch:</p>
          <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
            <li>Các trạng thái thanh toán và số dư ví sẽ chỉ được cập nhật khi có mạng.</li>
            <li>Đơn hàng chưa thanh toán vẫn được lưu trữ an toàn trên thiết bị.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại kết nối</span>
          </button>

          <Link
            href="/"
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
