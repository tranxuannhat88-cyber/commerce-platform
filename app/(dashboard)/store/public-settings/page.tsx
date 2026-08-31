"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  ExternalLink,
  Store,
  Building2,
  Lock,
  Sparkles,
  Info,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { StorePublicSettings, StorePolicySettings } from "@/types";
import { DEFAULT_STORE_PUBLIC_SETTINGS } from "@/lib/storefront/seller-profile-service";
import { DEFAULT_STORE_POLICIES } from "@/lib/storefront/storefront-service";

export default function StorePublicSettingsPage() {
  const { store, updateStorePublicSettings } = useCommerceStore();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State for Public Settings
  const [publicSettings, setPublicSettings] = useState<StorePublicSettings>(
    store.public_settings || DEFAULT_STORE_PUBLIC_SETTINGS
  );

  // Form State for Policy Settings
  const [policySettings, setPolicySettings] = useState<StorePolicySettings>(
    store.policy_settings || DEFAULT_STORE_POLICIES
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStorePublicSettings(publicSettings, policySettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Hiển Thị Công Khai & Bảo Mật
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Kiểm soát chi tiết các thông tin được phép hiển thị trên Trang cửa hàng và Hồ sơ người bán.
          </p>
        </div>

        {/* Quick View Links */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${store.slug}`}
            target="_blank"
            title="Xem trang cửa hàng giống như khách hàng nhìn thấy."
            className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Xem cửa hàng</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/seller/${store.slug}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Xem hồ sơ người bán</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">Đã lưu cài đặt thành công!</strong> Các thay đổi đã được áp dụng tức thì lên Trang cửa hàng và Hồ sơ người bán.
          </div>
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-bold">Quy Tắc Bảo Mật Tuyệt Đối (Privacy-First Whitelist):</p>
          <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
            Số điện thoại đăng nhập, email tài khoản, địa chỉ nhà riêng và giấy tờ thuế nội bộ luôn được ẩn tuyệt đối. Chỉ những trường bạn chủ động bật bên dưới mới xuất hiện công khai cho khách hàng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Brand & Identity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              1. Nhận Diện Thương Hiệu & Khu Vực
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_logo}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_logo: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Hiển thị Logo</span>
                <span className="text-neutral-500 text-[11px]">Logo đại diện của Store / Doanh nghiệp</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_description}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_description: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Hiển thị Giới thiệu</span>
                <span className="text-neutral-500 text-[11px]">Mô tả ngắn gọn năng lực & ngành nghề</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_region}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_region: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Hiển thị Vùng / Tỉnh Thành</span>
                <span className="text-neutral-500 text-[11px]">Ví dụ: Hải Phòng, TP.HCM, Hà Nội</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_full_address}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_full_address: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Hiển thị Địa chỉ chi tiết</span>
                <span className="text-neutral-500 text-[11px]">Chỉ nên bật nếu là văn phòng / showroom công khai</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Opt-in Public Contacts */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <Phone className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              2. Thông Tin Liên Hệ Khách Hàng (Tùy chọn)
            </h3>
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Hiển thị Hotline / Số điện thoại tư vấn
                </span>
                <input
                  type="checkbox"
                  checked={publicSettings.show_business_phone}
                  onChange={(e) => setPublicSettings({ ...publicSettings, show_business_phone: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
              {publicSettings.show_business_phone && (
                <input
                  type="text"
                  placeholder="0988.123.456"
                  value={publicSettings.public_contact_phone || ""}
                  onChange={(e) => setPublicSettings({ ...publicSettings, public_contact_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                />
              )}
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Hiển thị Email nhận đơn hàng / Báo giá
                </span>
                <input
                  type="checkbox"
                  checked={publicSettings.show_business_email}
                  onChange={(e) => setPublicSettings({ ...publicSettings, show_business_email: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
              {publicSettings.show_business_email && (
                <input
                  type="email"
                  placeholder="contact@2k-tech.vn"
                  value={publicSettings.public_business_email || ""}
                  onChange={(e) => setPublicSettings({ ...publicSettings, public_business_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                />
              )}
            </div>

            {/* Website */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Hiển thị Website chính thức
                </span>
                <input
                  type="checkbox"
                  checked={publicSettings.show_website}
                  onChange={(e) => setPublicSettings({ ...publicSettings, show_website: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
              {publicSettings.show_website && (
                <input
                  type="url"
                  placeholder="https://invamax.com"
                  value={publicSettings.website_url || ""}
                  onChange={(e) => setPublicSettings({ ...publicSettings, website_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Catalog & Discovery */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <Store className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              3. Hiển Thị Khám Phá & Chỉ Số Uy Tín
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_products}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_products: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Danh Mục Sản Phẩm</span>
                <span className="text-neutral-500 text-[11px]">Hiển thị danh sách sản phẩm trong kho trên Trang cửa hàng</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_active_offers}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_active_offers: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Mục Ưu Đãi Đang Chạy</span>
                <span className="text-neutral-500 text-[11px]">Nổi bật các gói giá ưu đãi (Active Offers)</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_reputation}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_reputation: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Chỉ Số Uy Tín & Đánh Giá</span>
                <span className="text-neutral-500 text-[11px]">Điểm tín nhiệm Merkle, số giao dịch & tỷ lệ hoàn thành</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={publicSettings.show_policies}
                onChange={(e) => setPublicSettings({ ...publicSettings, show_policies: e.target.checked })}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 block">Chính Sách Bán Hàng</span>
                <span className="text-neutral-500 text-[11px]">Vận chuyển, bảo hành, đổi trả & thanh toán</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Policies Content */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <FileText className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              4. Nội Dung Chính Sách & Cam Kết Dịch Vụ
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Chính Sách Vận Chuyển & Giao Hàng
              </label>
              <textarea
                rows={2}
                value={policySettings.shipping_policy || ""}
                onChange={(e) => setPolicySettings({ ...policySettings, shipping_policy: e.target.value })}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Chính Sách Đổi Trả & Hoàn Tiền
              </label>
              <textarea
                rows={2}
                value={policySettings.return_policy || ""}
                onChange={(e) => setPolicySettings({ ...policySettings, return_policy: e.target.value })}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Chính Sách Bảo Hành & Bảo Trì
              </label>
              <textarea
                rows={2}
                value={policySettings.warranty_policy || ""}
                onChange={(e) => setPolicySettings({ ...policySettings, warranty_policy: e.target.value })}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Quy Định Thanh Toán & Hóa Đơn VAT
              </label>
              <textarea
                rows={2}
                value={policySettings.payment_terms || ""}
                onChange={(e) => setPolicySettings({ ...policySettings, payment_terms: e.target.value })}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>LƯU CẤU HÌNH HIỂN THỊ CÔNG KHAI</span>
          </button>
        </div>
      </form>
    </div>
  );
}
