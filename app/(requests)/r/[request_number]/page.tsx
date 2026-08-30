"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileQuestion,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Send,
  Paperclip,
  Share2,
  QrCode,
  Building,
  ArrowRight,
  ShieldCheck,
  Download,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDate, formatDateTime } from "@/lib/utils";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";

export default function PublicRequestPage() {
  const params = useParams();
  const requestNumber = params?.request_number as string;

  const { requests } = useCommerceStore();
  const [showQR, setShowQR] = useState(false);

  const request = requests.find((r) => r.request_number === requestNumber) || requests[0];

  if (!request) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-base font-bold">Không tìm thấy yêu cầu này</p>
          <Link href="/" className="mt-3 inline-block text-blue-600 font-semibold text-xs">
            ← Quay lại Bảng điều khiển
          </Link>
        </div>
      </div>
    );
  }

  const reqUrl = typeof window !== "undefined" ? window.location.href : `/r/${request.request_number}`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              RFQ
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {request.request_number}
              </span>
              <p className="text-[10px] text-neutral-400">Demand Commerce Network</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 rounded-xl"
              title="QR Request"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <CopyButton text={reqUrl} label="Share RFQ" className="text-xs" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Request Title Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              {request.request_type}
            </span>
            <span className="text-xs text-neutral-400">
              Đăng ngày: {formatDate(request.created_at)}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 leading-tight">
            {request.title}
          </h1>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-medium">Ngân sách dự kiến</span>
              <p className="font-bold text-neutral-900 dark:text-neutral-100 text-xs mt-0.5">
                {request.target_budget ? formatVND(request.target_budget) : "Thương lượng"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-medium">Hạn nhận báo giá</span>
              <p className="font-bold text-amber-600 text-xs mt-0.5">
                {request.quotation_deadline ? formatDate(request.quotation_deadline) : "15 ngày"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-medium">Địa điểm giao hàng</span>
              <p className="font-bold text-neutral-900 dark:text-neutral-100 text-xs mt-0.5 truncate">
                {request.delivery_location || "Toàn quốc"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-medium">Đã nhận</span>
              <p className="font-bold text-emerald-600 text-xs mt-0.5">
                {request.quotations_count || 0} báo giá
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Items & Specs */}
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Hạng mục chi tiết & Quy cách yêu cầu
          </h3>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-xs">
            {request.items?.map((item) => (
              <div key={item.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-neutral-100">
                  <span>{item.name}</span>
                  <span className="text-emerald-600 font-black">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.specification && (
                  <p className="text-neutral-500 text-[11px]">Quy cách: {item.specification}</p>
                )}
                {item.description && (
                  <p className="text-neutral-600 dark:text-neutral-400">{item.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Mô tả chi tiết từ bên mua:
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-700">
              {request.description}
            </p>
          </div>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="pt-2 space-y-2">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Tài liệu & Bản vẽ kỹ thuật đính kèm:
              </h4>
              <div className="space-y-2">
                {request.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {att.file_name}
                      </span>
                    </div>
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border text-blue-600 hover:text-blue-700 font-semibold text-xs shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xem file</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA: Send Quotation Button (For both Guest and Logged-in Sellers) */}
        <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-lg font-bold">Bạn là xưởng sản xuất hoặc nhà cung cấp?</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Gửi bảng báo giá trực tiếp đến khách hàng chỉ trong 1 phút (Không bắt buộc tạo tài khoản trước).
            </p>
          </div>

          <Link
            href={`/r/${request.request_number}/quote`}
            className="px-6 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-neutral-100 font-extrabold text-xs shadow-lg flex items-center gap-2 shrink-0 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-emerald-600" />
            <span>GỬI BÁO GIÁ NGAY</span>
          </Link>
        </div>
      </main>

      {/* QR MODAL */}
      {showQR && (
        <QRModal
          isOpen={true}
          onClose={() => setShowQR(false)}
          url={reqUrl}
          title={request.request_number}
          subtitle={request.title}
        />
      )}
    </div>
  );
}
