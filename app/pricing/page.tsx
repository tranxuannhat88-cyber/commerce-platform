"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Check,
  Zap,
  Shield,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  Layers,
  ShoppingBag,
  Send,
  FileQuestion,
  Database,
  Users,
  Store,
  Bot,
  Plus,
  Info,
  Phone,
  Mail,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { BillingPeriod, BillingPlanCode } from "@/lib/billing/types";
import { BILLING_PLANS, PLANS_ARRAY, BILLING_CONFIG } from "@/lib/billing/plans-config";
import { BILLING_ADDONS } from "@/lib/billing/addons-config";
import { useCommerceStore } from "@/lib/db/store";

export default function PricingPage() {
  const router = useRouter();
  const { currentUser } = useCommerceStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Enterprise Modal
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const [entForm, setEntForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    expectedVolume: "10000+",
    notes: "",
  });

  const handleSelectPlan = (planCode: BillingPlanCode) => {
    if (planCode === "ENTERPRISE") {
      setIsEnterpriseModalOpen(true);
      return;
    }
    router.push(`/billing/checkout?plan=${planCode}&period=${billingPeriod}`);
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnterpriseSubmitted(true);
    setTimeout(() => {
      setIsEnterpriseModalOpen(false);
      setEnterpriseSubmitted(false);
    }, 3000);
  };

  const faqs = [
    {
      q: "Tôi có thể sử dụng miễn phí mãi mãi không?",
      a: "Có! Gói FREE hoàn toàn miễn phí và không giới hạn thời gian. Bạn có thể tạo Offer, mở Yêu cầu RFQ và gửi Báo giá không giới hạn nếu quy mô kinh doanh nằm trong hạn mức 50 giao dịch và 50 sản phẩm/tháng.",
    },
    {
      q: "Nếu cửa hàng của tôi vượt quá số lượng giao dịch trong tháng thì sao?",
      a: "Hệ thống KHÔNG BAO GIỜ chặn việc đặt hàng hay thanh toán của khách mua hàng. Khách hàng vẫn mua sắm bình thường. Workspace của bạn sẽ nhận được thông báo nhắc nhở và bạn có thể mua thêm gói giao dịch Add-on hoặc nâng cấp gói bất kỳ lúc nào.",
    },
    {
      q: "Dữ liệu và sản phẩm có bị xóa nếu tôi hết hạn gói hoặc hạ cấp về FREE không?",
      a: "Tuyệt đối KHÔNG. Toàn bộ hình ảnh, sản phẩm, dữ liệu kho và lịch sử giao dịch của bạn vẫn được lưu giữ an toàn 100%. Khi hạ cấp hoặc hết hạn, bạn chỉ bị tạm khóa quyền đăng tải thêm sản phẩm mới vượt hạn mức của gói FREE.",
    },
    {
      q: "Có giới hạn số lượng tạo Offer, Request và Báo giá không?",
      a: "Không. Chúng tôi cam kết KHÔNG giới hạn và KHÔNG thu phí đối với việc tạo Offer, mở Request (RFQ) và gửi Quotation trên tất cả các gói dịch vụ.",
    },
    {
      q: "Thanh toán Hàng Năm có ưu đãi gì so với Hàng Tháng?",
      a: "Khi chọn chu kỳ Hàng Năm, bạn được áp dụng chính sách 'Thanh toán 10 tháng – Sử dụng 12 tháng', giúp tiết kiệm tương đương 2 tháng phí dịch vụ (lên tới gần 1.000.000đ).",
    },
    {
      q: "Tôi có thể mua thêm dung lượng lưu trữ mà không cần nâng cấp gói không?",
      a: "Hoàn toàn được. Bạn có thể mua các gói Add-on mở rộng dung lượng (+5GB, +10GB, +50GB...), sản phẩm hoặc số lượng người dùng độc lập bất cứ lúc nào.",
    },
    {
      q: "Hệ thống hỗ trợ những phương thức thanh toán nào?",
      a: "Hệ thống hỗ trợ thanh toán trực tuyến tự động qua chuyển khoản VietQR từ tất cả các ngân hàng tại Việt Nam, kích hoạt gói dịch vụ tức thì sau khi quét mã.",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight">COMMERCE PLATFORM</span>
          </Link>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Vào Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  Bắt đầu ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Public Test Banner */}
      {BILLING_CONFIG.IS_PUBLIC_TEST && (
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs py-2 px-4 text-center font-semibold">
          ✨ {BILLING_CONFIG.PUBLIC_TEST_NOTICE}
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 text-center px-4 max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span>START FREE. PAY AS YOU GROW.</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
          Bắt đầu miễn phí. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
            Trả phí khi bạn phát triển.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Tạo cửa hàng, nhận đơn, gửi báo giá và thực hiện giao dịch mà không cần trả phí khi quy mô còn nhỏ. Nâng cấp hoặc mua thêm dung lượng bất cứ lúc nào.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Không phí thiết lập
          </span>
          <span className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Không giới hạn Offer, RFQ & Báo giá
          </span>
          <span className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Nâng cấp linh hoạt bất cứ lúc nào
          </span>
        </div>
      </section>

      {/* 2. BILLING PERIOD TOGGLE */}
      <section className="pb-10 flex flex-col items-center justify-center gap-3 px-4">
        <div className="p-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingPeriod("MONTHLY")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingPeriod === "MONTHLY"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            HÀNG THÁNG
          </button>

          <button
            type="button"
            onClick={() => setBillingPeriod("ANNUAL")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingPeriod === "ANNUAL"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            <span>HÀNG NĂM</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              Tiết kiệm 2 tháng
            </span>
          </button>
        </div>
        <p className="text-[11px] text-neutral-400">
          {billingPeriod === "ANNUAL"
            ? "✓ Thanh toán 10 tháng – Sử dụng trọn vẹn 12 tháng"
            : "Linh hoạt hủy hoặc đổi chu kỳ thanh toán bất cứ lúc nào"}
        </p>
      </section>

      {/* 3. MAIN PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4 items-stretch">
          {PLANS_ARRAY.map((plan) => {
            const isFeatured = plan.is_featured;
            const priceObj = plan.prices[billingPeriod];
            const isEnterprise = plan.code === "ENTERPRISE";
            const isFree = plan.code === "FREE";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col justify-between transition-all ${
                  isFeatured
                    ? "bg-white dark:bg-neutral-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 lg:-translate-y-2 z-10 p-6 sm:p-7"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs p-6"
                }`}
              >
                {/* Featured Badge */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white font-black text-[10px] tracking-wider uppercase shadow-md shadow-blue-600/30">
                    {plan.highlight_badge || "PHỔ BIẾN NHẤT"}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Plan Name & Tagline */}
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-neutral-500 min-h-[32px] mt-1 leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2 border-y border-neutral-100 dark:border-neutral-800/80">
                    {isEnterprise ? (
                      <div>
                        <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                          LIÊN HỆ
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Tùy biến theo quy mô</p>
                      </div>
                    ) : isFree ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100">0đ</span>
                          <span className="text-xs text-neutral-400">/ vĩnh viễn</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                          Miễn phí trọn đời
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                            {formatVND(
                              billingPeriod === "ANNUAL"
                                ? priceObj.monthly_equivalent || 0
                                : priceObj.amount
                            )}
                          </span>
                          <span className="text-xs text-neutral-400">/ tháng</span>
                        </div>

                        {billingPeriod === "ANNUAL" ? (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Thanh toán <strong className="text-neutral-900 dark:text-neutral-100">{formatVND(priceObj.amount)}</strong> / năm
                          </p>
                        ) : (
                          <p className="text-[11px] text-neutral-400 mt-0.5">Thanh toán theo tháng</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {plan.feature_bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.code)}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFeatured
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 active:scale-98"
                        : isFree
                        ? "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                        : "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900"
                    }`}
                  >
                    <span>{plan.cta_label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURE COMPARISON MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            So Sánh Chi Tiết Quyền Lợi Các Gói
          </h2>
          <p className="text-xs text-neutral-500">
            Xem toàn bộ giới hạn định lượng và tính năng chuyên sâu theo từng phân khúc
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="py-4 px-6 font-black text-neutral-900 dark:text-neutral-100 w-1/4">
                  Tính Năng & Hạn Mức
                </th>
                <th className="py-4 px-4 font-bold text-neutral-700 dark:text-neutral-300 text-center">
                  FREE
                </th>
                <th className="py-4 px-4 font-bold text-neutral-700 dark:text-neutral-300 text-center">
                  STARTER
                </th>
                <th className="py-4 px-4 font-black text-blue-600 dark:text-blue-400 text-center bg-blue-50/50 dark:bg-blue-950/20">
                  PRO ★
                </th>
                <th className="py-4 px-4 font-bold text-neutral-700 dark:text-neutral-300 text-center">
                  BUSINESS
                </th>
                <th className="py-4 px-4 font-bold text-neutral-700 dark:text-neutral-300 text-center">
                  ENTERPRISE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Giao dịch xác nhận / tháng
                </td>
                <td className="py-3.5 px-4 text-center">50</td>
                <td className="py-3.5 px-4 text-center font-bold">300</td>
                <td className="py-3.5 px-4 text-center font-black text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  1.500
                </td>
                <td className="py-3.5 px-4 text-center font-bold">5.000</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Tùy biến</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Sản phẩm đang hoạt động
                </td>
                <td className="py-3.5 px-4 text-center">50</td>
                <td className="py-3.5 px-4 text-center font-bold">300</td>
                <td className="py-3.5 px-4 text-center font-black text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  2.000
                </td>
                <td className="py-3.5 px-4 text-center font-bold">10.000</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Dung lượng lưu trữ (Media & File)
                </td>
                <td className="py-3.5 px-4 text-center">500 MB</td>
                <td className="py-3.5 px-4 text-center font-bold">3 GB</td>
                <td className="py-3.5 px-4 text-center font-black text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  15 GB
                </td>
                <td className="py-3.5 px-4 text-center font-bold">50 GB</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Theo yêu cầu</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Người dùng vận hành (Users)
                </td>
                <td className="py-3.5 px-4 text-center">1</td>
                <td className="py-3.5 px-4 text-center">2</td>
                <td className="py-3.5 px-4 text-center font-black text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  5
                </td>
                <td className="py-3.5 px-4 text-center font-bold">15</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Trang Cửa Hàng / Kênh Bán
                </td>
                <td className="py-3.5 px-4 text-center">1</td>
                <td className="py-3.5 px-4 text-center">1</td>
                <td className="py-3.5 px-4 text-center font-black text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  3
                </td>
                <td className="py-3.5 px-4 text-center font-bold">10</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Tùy biến</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Offer, Request RFQ & Quotation
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/10">
                  Không giới hạn
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Không giới hạn</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Quản lý Tồn kho
                </td>
                <td className="py-3.5 px-4 text-center text-neutral-500">Cơ bản</td>
                <td className="py-3.5 px-4 text-center text-neutral-700">Cơ bản</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  Nâng cao (Đa kho)
                </td>
                <td className="py-3.5 px-4 text-center font-bold">Nâng cao (Đa kho)</td>
                <td className="py-3.5 px-4 text-center font-bold">Tùy biến ERP</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Phân quyền thành viên (Roles)
                </td>
                <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-center text-neutral-700">Cơ bản</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  Chuyên sâu (6 vai trò)
                </td>
                <td className="py-3.5 px-4 text-center font-bold">Custom Roles</td>
                <td className="py-3.5 px-4 text-center font-bold">SSO / SAML</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Xác thực giao dịch (Trust & Audit)
                </td>
                <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  ✓ Kích hoạt
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Kích hoạt</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">✓ Private Anchor</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Kết nối API & Webhooks
                </td>
                <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-center text-neutral-400">—</td>
                <td className="py-3.5 px-4 text-center text-neutral-700 bg-blue-50/30 dark:bg-blue-950/10">
                  Giới hạn
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Đầy đủ (Full API)</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Custom Gateway</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-bold text-neutral-800 dark:text-neutral-200">
                  Hỗ trợ kỹ thuật (SLA)
                </td>
                <td className="py-3.5 px-4 text-center text-neutral-500">Cộng đồng</td>
                <td className="py-3.5 px-4 text-center text-neutral-700">Standard</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-950/10">
                  Ưu tiên (Priority)
                </td>
                <td className="py-3.5 px-4 text-center font-bold">Chuyên trách 24/7</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Kỹ sư riêng & SLA 99.99%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. ADD-ON SECTION */}
      <section className="bg-neutral-100/70 dark:bg-neutral-900/60 border-y border-neutral-200/80 dark:border-neutral-800 py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
              DỊCH VỤ MỞ RỘNG
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Cần thêm một chút nhưng chưa muốn đổi gói?
            </h2>
            <p className="text-xs text-neutral-500">
              Mua thêm dung lượng, giao dịch hoặc số lượng người dùng theo nhu cầu thực tế bất cứ lúc nào.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category 1: Giao Dịch */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Gói Giao Dịch (Transactions)</h4>
              </div>
              <div className="space-y-2">
                {BILLING_ADDONS.filter((a) => a.metric === "TRANSACTIONS").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">{item.description}</p>
                    </div>
                    <span className="font-black text-blue-600 shrink-0">{formatVND(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 2: Dung Lượng Lưu Trữ */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <Database className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Dung Lượng Lưu Trữ (Storage)</h4>
              </div>
              <div className="space-y-2">
                {BILLING_ADDONS.filter((a) => a.metric === "STORAGE_GB").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">{item.description}</p>
                    </div>
                    <span className="font-black text-purple-600 shrink-0">{formatVND(item.price)}/tháng</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category 3: Sản Phẩm & Người Dùng */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Sản Phẩm & Nhân Sự (Capacity)</h4>
              </div>
              <div className="space-y-2">
                {BILLING_ADDONS.filter((a) => a.metric === "ACTIVE_PRODUCTS" || a.metric === "USERS").slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">{item.display_value}</p>
                    </div>
                    <span className="font-black text-emerald-600 shrink-0">{formatVND(item.price)}/tháng</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mx-auto">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Câu Hỏi Thường Gặp
          </h2>
          <p className="text-xs text-neutral-500">Giải đáp thắc mắc về chính sách giá, thanh toán và bảo toàn dữ liệu</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-neutral-900 dark:text-neutral-100">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight max-w-xl mx-auto">
            Sẵn sàng mở rộng quy mô kinh doanh của bạn?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
            Khởi đầu hoàn toàn miễn phí hôm nay. Không yêu cầu thẻ tín dụng, trải nghiệm tức thì toàn bộ chuỗi cung ứng.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSelectPlan("FREE")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-blue-700 font-black text-xs shadow-lg transition-all cursor-pointer min-h-[44px]"
            >
              BẮT ĐẦU MIỄN PHÍ NGAY
            </button>
            <button
              type="button"
              onClick={() => handleSelectPlan("PRO")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-950/60 border border-white/20 text-white font-bold text-xs backdrop-blur-xs transition-all cursor-pointer min-h-[44px]"
            >
              DÙNG THỬ GÓI PRO
            </button>
          </div>
        </div>
      </section>

      {/* ENTERPRISE CONTACT MODAL */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>

            {enterpriseSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
                  Đã Gửi Yêu Cầu Tư Vấn Thành Công!
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Chuyên viên giải pháp của Commerce Platform sẽ liên hệ lại với bạn trong vòng 2 giờ làm việc.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                    <span>GÓI ENTERPRISE</span>
                  </div>
                  <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                    Tư Vấn Giải Pháp Doanh Nghiệp Lớn
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Vui lòng cung cấp thông tin nhu cầu để kỹ sư giải pháp thiết kế gói hạ tầng phù hợp nhất.
                  </p>
                </div>

                <form onSubmit={handleEnterpriseSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Tên Doanh nghiệp / Tổ chức *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Công ty CP Tập đoàn ABC"
                      value={entForm.companyName}
                      onChange={(e) => setEntForm({ ...entForm, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Họ và tên người liên hệ *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={entForm.contactName}
                        onChange={(e) => setEntForm({ ...entForm, contactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0988 123 456"
                        value={entForm.phone}
                        onChange={(e) => setEntForm({ ...entForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Email doanh nghiệp *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@abc.vn"
                      value={entForm.email}
                      onChange={(e) => setEntForm({ ...entForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Ghi chú nhu cầu hạ tầng riêng (ERP, SLA, số lượng chi nhánh...)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả sơ lược về quy mô và các yêu cầu tích hợp kỹ thuật..."
                      value={entForm.notes}
                      onChange={(e) => setEntForm({ ...entForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer min-h-[44px]"
                  >
                    GỬI YÊU CẦU TƯ VẤN NGAY
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
