"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Building,
  ShieldCheck,
  Users,
  Save,
  Lock,
  Sparkles,
  Fingerprint,
  Phone,
  ArrowRight,
  Shield,
  CreditCard,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { UserRole } from "@/types";
import { MediaUploadDropzone } from "@/components/shared/media-upload-dropzone";

export default function SettingsPage() {
  const { organization, updateOrganization, subscription } = useCommerceStore();
  const [orgName, setOrgName] = useState(organization.name);
  const [taxCode, setTaxCode] = useState(organization.tax_code || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [email, setEmail] = useState(organization.email || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization({
      name: orgName,
      tax_code: taxCode,
      phone,
      email,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const teamMembers = [
    { name: "Nguyễn Văn Hùng", email: "hung.nv@2k-tech.vn", role: "OWNER" as UserRole, status: "Active" },
    { name: "Trần Thị Mai", email: "mai.tt@2k-tech.vn", role: "SALES" as UserRole, status: "Active" },
    { name: "Lê Hoàng Long", email: "long.lh@2k-tech.vn", role: "WAREHOUSE" as UserRole, status: "Active" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          Thiết Lập Doanh Nghiệp & Phân Quyền (Organization)
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Quản lý thực thể cấp cao nhất (Multi-Tenant) và vai trò thành viên trong tổ chức
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
          ✓ Đã lưu thông tin Doanh nghiệp thành công!
        </div>
      )}

      {/* Quick Navigation Cards: Billing & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Billing & Subscription */}
        <Link
          href="/settings/billing"
          className="p-5 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs text-white shrink-0 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black">
              Gói {subscription.plan_code}
            </span>
          </div>
          <div className="space-y-1 mt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5">
              <span>Gói Dịch Vụ & Hạn Mức</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              Theo dõi 5 chỉ số tài nguyên, nâng cấp gói, mua Add-on và xem hóa đơn.
            </p>
          </div>
        </Link>

        {/* Account Security & Passkey */}
        <Link
          href="/settings/security"
          className="p-5 rounded-3xl bg-linear-to-r from-neutral-900 to-neutral-800 hover:from-black hover:to-neutral-900 dark:from-neutral-800 dark:to-neutral-700 text-white shadow-lg transition-all group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs text-white shrink-0 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              Passkey & OTP
            </span>
          </div>
          <div className="space-y-1 mt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5">
              <span>Bảo Mật & Xác Thực</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Face ID, Touch ID, Windows Hello, số điện thoại và phiên đăng nhập.
            </p>
          </div>
        </Link>
      </div>

      {/* RLS Security Status Badge */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-emerald-900 dark:text-emerald-200">
            PostgreSQL Row Level Security (RLS): Kích Hoạt
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
            Toàn bộ dữ liệu đơn hàng, kho bãi, sổ cái tài chính và báo giá được mã hóa và phân tách tuyệt đối theo mã định danh Tenant: <code className="font-mono bg-white/60 dark:bg-black/40 px-1 py-0.5 rounded">{organization.id}</code>
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Org Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Thông tin Pháp nhân / Doanh nghiệp</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Tên Doanh nghiệp / Hộ kinh doanh / Tổ chức *
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Mã số thuế (Tax Code)
              </label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Số điện thoại đại diện
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Thông Tin</span>
            </button>
          </div>
        </div>
      </form>

      {/* Team Members List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Thành viên & Phân Quyền (RBAC)</span>
        </h3>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-xs">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100">{member.name}</p>
                <p className="text-[11px] text-neutral-500">{member.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {member.role}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">● {member.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloudflare R2 Media & Document Storage Architecture Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quản Lý Lưu Trữ Đám Mây (Cloud Object Storage)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hạ tầng lưu trữ Cloudflare R2 / S3-compatible, không lưu nhị phân trong PostgreSQL
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              Gói Hiện Tại: PRO (10 GB)
            </span>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-700 dark:text-neutral-300">Dung lượng đã sử dụng:</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">1.24 GB / 10.00 GB (12.4%)</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex">
            <div className="bg-blue-600 h-full" style={{ width: "6%" }} title="Ảnh sản phẩm: 600MB" />
            <div className="bg-emerald-500 h-full" style={{ width: "3.5%" }} title="Tài liệu & Báo giá: 350MB" />
            <div className="bg-purple-600 h-full" style={{ width: "2.9%" }} title="Bằng chứng giao dịch & CAD: 290MB" />
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-neutral-600 dark:text-neutral-400">Ảnh SP: <strong>600 MB</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-600 dark:text-neutral-400">Tài liệu: <strong>350 MB</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-neutral-600 dark:text-neutral-400">Bằng chứng: <strong>290 MB</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-neutral-600 dark:text-neutral-400">Trống: <strong>8.76 GB</strong></span>
            </div>
          </div>
        </div>

        {/* Direct Upload Test Dropzone */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Tải Thử Nghiệm Trực Tiếp (Direct-to-Storage Upload):
          </p>
          <MediaUploadDropzone
            ownerType="ORGANIZATION"
            ownerId={organization.id}
            visibility="TRANSACTION_EVIDENCE"
            label="Kéo thả tài liệu / bản vẽ để kiểm tra tải trực tiếp lên Storage"
            helperText="Hệ thống tự động cấp Pre-signed PUT URL và băm SHA-256 xác thực"
            onUploadSuccess={(asset) => {
              alert(`Tải lên thành công!\nAsset ID: ${asset.id}\nObject Key: ${asset.object_key}\nSHA-256: ${asset.sha256_hash || 'Tạo tự động'}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
