"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Building,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  DollarSign,
  Lock,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND } from "@/lib/utils";

export default function QuickQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const requestNumber = params?.request_number as string;

  const { requests, submitQuotation } = useCommerceStore();
  const request = requests.find((r) => r.request_number === requestNumber);

  // Seller Guest Form state
  const [sellerName, setSellerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");

  // Commercial Terms
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTime, setLeadTime] = useState("5-7 ngày làm việc");
  const [paymentTerms, setPaymentTerms] = useState("Tạm ứng 30% khi ký HĐ, 70% sau khi nghiệm thu");
  const [warranty, setWarranty] = useState("Bảo hành 12 tháng theo tiêu chuẩn");
  const [deliveryTerms, setDeliveryTerms] = useState("Giao hàng tận xưởng bên mua");
  const [sellerNote, setSellerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-base font-bold">Không tìm thấy yêu cầu này</p>
        </div>
      </div>
    );
  }

  const primaryItem = request.items?.[0] || { id: "item-default", name: request.title, quantity: 1, unit: "gói", specification: "" };
  const calculatedTotal = (Number(unitPrice) || 0) * (primaryItem.quantity || 1);

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerName.trim() || !sellerPhone.trim() || !unitPrice) return;

    setIsSubmitting(true);

    const claimToken = `claim-token-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newQuote = submitQuotation({
      request_id: request.id,
      request_title: request.title,
      guest_seller_name: sellerName.trim(),
      guest_company_name: companyName.trim() || undefined,
      guest_phone: sellerPhone.trim(),
      guest_email: sellerEmail.trim() || undefined,
      guest_claim_token: claimToken,
      currency: "VND",
      subtotal: calculatedTotal,
      discount: 0,
      tax: 0,
      shipping_fee: 0,
      total: calculatedTotal,
      lead_time: leadTime,
      payment_terms: paymentTerms,
      delivery_terms: deliveryTerms,
      warranty: warranty,
      note: sellerNote.trim() || undefined,
      status: "SUBMITTED",
      items: [
        {
          id: `qi-${Date.now()}`,
          quotation_id: "",
          request_item_id: primaryItem.id,
          item_name: primaryItem.name,
          specification: primaryItem.specification,
          quantity: primaryItem.quantity,
          unit: primaryItem.unit,
          unit_price: Number(unitPrice),
          total_price: calculatedTotal,
        },
      ],
    });

    router.push(`/r/${request.request_number}/quote-success?token=${claimToken}&quoteNum=${newQuote.quotation_number}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-24 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/r/${request.request_number}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Xem yêu cầu {request.request_number}</span>
          </Link>
          <div className="flex items-center gap-1 text-xs text-neutral-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Báo giá bảo mật trực tiếp tới bên mua</span>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        <form onSubmit={handleSubmitQuote} className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-linear-to-r from-neutral-900 to-neutral-800 text-white rounded-3xl space-y-1 shadow-md">
            <span className="text-[10px] uppercase font-bold text-emerald-400">
              Gửi báo giá cạnh tranh
            </span>
            <h1 className="text-lg font-bold">Báo Giá Cho: {request.title}</h1>
            <p className="text-xs text-neutral-300">
              Yêu cầu số lượng: <strong className="text-white">{primaryItem.quantity} {primaryItem.unit}</strong>
            </p>
          </div>

          {/* 1. Seller Information */}
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>1. Thông tin Đơn vị Báo giá / Xưởng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Họ và tên người đại diện *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phạm Quốc Tuấn"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên Công ty / Xưởng sản xuất (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơ Khí Chính Xác Tân Bình"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0933 555 777"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tuan.cokhi@gmail.com"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* 2. Quotation Pricing */}
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>2. Bảng giá chào thầu</span>
            </h3>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {primaryItem.name}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Số lượng: {primaryItem.quantity} {primaryItem.unit}
                </p>
              </div>

              <div className="w-44">
                <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">
                  Đơn giá chào (VNĐ / {primaryItem.unit}) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="165000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 text-sm font-black text-neutral-900 dark:text-neutral-100">
              <span>Tổng giá trị báo giá:</span>
              <span className="text-xl text-emerald-600 dark:text-emerald-400">
                {formatVND(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* 3. Commercial Terms */}
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>3. Tiến độ & Điều khoản thương mại</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Thời gian hoàn thành (Lead time)
                </label>
                <input
                  type="text"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Bảo hành & Cam kết chất lượng
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Điều khoản thanh toán
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Ghi chú năng lực sản xuất / Lưu ý thêm
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Xưởng có sẵn phôi Inox 304, dùng máy Mazak độ chính xác cao..."
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Đang gửi báo giá..." : "GỬI BÁO GIÁ CHO BÊN MUA"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
