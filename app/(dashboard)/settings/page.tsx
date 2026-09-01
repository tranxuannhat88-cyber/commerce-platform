"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Building2,
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
  User,
  ArrowRightLeft,
  CheckCircle2,
  Plus,
  Mail,
  MapPin,
  FileText,
  Camera,
  Trash2,
  Upload,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { UserRole, OrganizationType } from "@/types";
import { MediaUploadDropzone } from "@/components/shared/media-upload-dropzone";
import { CreateOrgModal } from "@/components/dashboard/create-org-modal";
import { PersonalTeamNoticeModal } from "@/components/dashboard/personal-team-notice-modal";

export default function SettingsPage() {
  const {
    organization,
    organizations,
    updateOrganization,
    currentUser,
    updateUserProfile,
    personalActor,
    currentContext,
    subscription,
    store,
    transferStoreToOrganization,
  } = useCommerceStore();

  const isPersonal = currentContext.context_type === "PERSONAL";

  // Form states
  const [personalName, setPersonalName] = useState(currentUser?.full_name || personalActor.display_name);
  const [personalAvatar, setPersonalAvatar] = useState(currentUser?.avatar_url || personalActor.avatar_url || "");
  const [orgName, setOrgName] = useState(organization.name);
  const [shortName, setShortName] = useState(organization.short_name || "");
  const [orgLogo, setOrgLogo] = useState(organization.logo_url || "");
  const [orgType, setOrgType] = useState<OrganizationType>(organization.org_type || "COMPANY");
  const [taxCode, setTaxCode] = useState(organization.tax_code || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [email, setEmail] = useState(organization.email || "");
  const [address, setAddress] = useState(organization.address || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize form states when organization or user changes
  useEffect(() => {
    setPersonalName(currentUser?.full_name || personalActor.display_name);
    setPersonalAvatar(currentUser?.avatar_url || personalActor.avatar_url || "");
    setOrgName(organization.name);
    setShortName(organization.short_name || "");
    setOrgLogo(organization.logo_url || "");
    setOrgType(organization.org_type || "COMPANY");
    setTaxCode(organization.tax_code || "");
    setPhone(organization.phone || "");
    setEmail(organization.email || "");
    setAddress(organization.address || "");
  }, [organization, currentUser, personalActor]);

  // Image compression helper
  const compressImageFile = (file: File, maxDim = 400, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 0.75);
      setPersonalAvatar(compressed);
      updateUserProfile({ avatar_url: compressed });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAvatar = () => {
    setPersonalAvatar("");
    updateUserProfile({ avatar_url: "" });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 0.75);
      setOrgLogo(compressed);
      updateOrganization({ logo_url: compressed });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveOrgLogo = () => {
    setOrgLogo("");
    updateOrganization({ logo_url: "" });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Store Transfer state
  const [selectedTargetOrgId, setSelectedTargetOrgId] = useState(organizations[0]?.id || "");
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Modals
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showPersonalTeamModal, setShowPersonalTeamModal] = useState(false);

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ full_name: personalName, avatar_url: personalAvatar });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization({
      name: orgName,
      short_name: shortName.trim() || undefined,
      logo_url: orgLogo || undefined,
      org_type: orgType,
      tax_code: taxCode.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTransferStore = () => {
    if (!selectedTargetOrgId) return;
    const ok = transferStoreToOrganization(store.id, selectedTargetOrgId);
    if (ok) {
      setTransferSuccess(true);
      setTimeout(() => setTransferSuccess(false), 3000);
    }
  };

  const teamMembers = [
    { name: currentUser?.full_name || "Trần Xuân Nhật", email: currentUser?.primary_phone || "nhat.tx@invamax.com", role: (currentContext.role || "OWNER") as UserRole, status: "Active" },
    { name: "Trần Thị Mai", email: "mai.tt@2k-tech.vn", role: "SALES" as UserRole, status: "Active" },
    { name: "Lê Hoàng Long", email: "long.lh@2k-tech.vn", role: "WAREHOUSE" as UserRole, status: "Active" },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
            {isPersonal ? <User className="w-6 h-6 text-blue-600" /> : <Building2 className="w-6 h-6 text-blue-600" />}
            <span>
              {isPersonal ? "Cài Đặt Tài Khoản Cá Nhân" : `Thiết Lập Doanh Nghiệp (${organization.short_name || organization.name})`}
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isPersonal
              ? "Quản lý thông tin định danh cá nhân, bảo mật Passkey và chuyển đổi cửa hàng"
              : "Quản lý pháp nhân, thông tin doanh nghiệp, thành viên và phân quyền"}
          </p>
        </div>

        {isPersonal && (
          <button
            type="button"
            onClick={() => setShowCreateOrgModal(true)}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4 text-blue-500" />
            <span>+ Tạo Tổ Chức Mới</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thông tin thành công!</span>
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
            <span className="px-2.5 py-0.5 rounded-full bg-blue-400 text-neutral-950 text-[10px] font-black">
              FIDO2 / WebAuthn
            </span>
          </div>
          <div className="space-y-1 mt-4">
            <h3 className="text-sm font-black flex items-center gap-1.5">
              <span>Bảo Mật & Passkey</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Đăng nhập không mật khẩu bằng vân tay / khuôn mặt và quản lý phiên đăng nhập.
            </p>
          </div>
        </Link>
      </div>

      {/* PERSONAL CONTEXT SETTINGS */}
      {isPersonal ? (
        <div className="space-y-6">
          {/* Profile Form */}
          <form
            onSubmit={handleSavePersonal}
            className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5"
          >
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Hồ Sơ Cá Nhân & Ảnh Đại Diện</span>
            </h3>

            {/* Avatar Picker Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700">
              <div className="relative w-20 h-20 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-neutral-800">
                {personalAvatar ? (
                  <img
                    src={personalAvatar}
                    alt="Ảnh đại diện"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (personalName?.trim() ? personalName.trim().charAt(0).toUpperCase() : "U")
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Ảnh Đại Diện Cá Nhân (Avatar)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Chọn ảnh từ máy tính hoặc điện thoại. Nếu không chọn ảnh, hệ thống hiển thị mặc định chữ cái đầu tiên của tên bạn.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{personalAvatar ? "Đổi ảnh đại diện" : "Chọn ảnh từ thiết bị"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>

                  {personalAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Xóa ảnh (dùng chữ cái)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={personalName}
                  onChange={(e) => setPersonalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Số điện thoại đăng nhập
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.primary_phone || "+84988123456"}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 text-neutral-500 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Hồ Sơ</span>
              </button>
            </div>
          </form>

          {/* Personal 1-Person Notice Card */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>Mô hình vận hành Cá nhân (1 người)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonalTeamModal(true)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Tìm hiểu thêm
              </button>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Hình thức <strong>Cá nhân</strong> dành cho 1 người tự quản lý và vận hành. Nếu bạn muốn nhiều người cùng tham gia và được phân quyền vai trò (Sales, Kho, Kế toán), hãy <strong>tạo Tổ chức</strong>.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCreateOrgModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Tạo Tổ Chức Để Phân Quyền</span>
              </button>
            </div>
          </div>

          {/* Store Transfer to Organization Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>Chuyển Cửa Hàng Sang Tổ Chức (Store Transfer)</span>
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Bạn có thể chuyển cửa hàng <strong>{store.store_name}</strong> sang một Tổ chức bạn quản lý để cùng đội ngũ vận hành. Toàn bộ mã cửa hàng, link công khai, sản phẩm và lịch sử đơn hàng được giữ nguyên 100%.
              </p>
            </div>

            {transferSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ Đã chuyển cửa hàng sang Tổ chức thành công!
              </div>
            )}

            {organizations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
                Bạn chưa có Tổ chức nào. Hãy tạo Tổ chức trước khi thực hiện chuyển giao.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <select
                  value={selectedTargetOrgId}
                  onChange={(e) => setSelectedTargetOrgId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 flex-1 outline-none"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      Chuyển sang: {org.short_name ? `${org.short_name} - ${org.name}` : org.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleTransferStore}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
                >
                  Xác Nhận Chuyển Giao
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ORGANIZATION CONTEXT SETTINGS */
        <div className="space-y-6">
          <form
            onSubmit={handleSaveOrg}
            className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Pháp Nhân & Logo Doanh Nghiệp</span>
              </h3>
              <span className="text-[11px] text-neutral-400 font-mono">
                ID: {organization.id}
              </span>
            </div>

            {/* Org Logo Picker Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700">
              <div className="relative w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-neutral-800">
                {orgLogo ? (
                  <img
                    src={orgLogo}
                    alt="Logo tổ chức"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (orgName?.trim() ? orgName.trim().charAt(0).toUpperCase() : "O")
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Logo / Ảnh Đại Diện Tổ Chức
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Chọn logo từ máy tính hoặc điện thoại. Nếu không chọn logo, hệ thống hiển thị mặc định chữ cái đầu tiên của tên tổ chức.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{orgLogo ? "Đổi logo tổ chức" : "Chọn logo từ thiết bị"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOrgLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {orgLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveOrgLogo}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300 font-bold text-xs cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Xóa logo (dùng chữ cái)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Tên đầy đủ & Tên viết tắt */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên đầy đủ (Theo ĐKKD / Giấy phép) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tên viết tắt / Thương hiệu
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 2. Loại hình hoạt động */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Loại hình hoạt động
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "COMPANY" as OrganizationType, label: "🏢 Công ty" },
                  { type: "HOUSEHOLD" as OrganizationType, label: "🏪 Hộ kinh doanh" },
                  { type: "OTHER" as OrganizationType, label: "👥 Nhóm / Khác" },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setOrgType(item.type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      orgType === item.type
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs"
                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Mã số thuế, Phone, Email */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mã số thuế (Tax Code)
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hotline / Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 4. Địa chỉ */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Địa chỉ trụ sở / Văn phòng
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Thông Tin Tổ Chức</span>
              </button>
            </div>
          </form>

          {/* Team Members List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Thành viên & Phân Quyền ({teamMembers.length} người)</span>
              </h3>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                + Mời Thành Viên
              </button>
            </div>

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
        </div>
      )}

      {/* Cloudflare R2 Media & Document Storage Architecture Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Quản Lý Lưu Trữ Đám Mây (Cloud Object Storage)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hạ tầng lưu trữ Cloudflare R2 / S3-compatible, bảo mật bằng chữ ký SHA-256
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              Gói Hiện Tại: {subscription.plan_code}
            </span>
          </div>
        </div>

        {/* Direct Upload Test Dropzone */}
        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Tải Thử Nghiệm Trực Tiếp (Direct-to-Storage Upload):
          </p>
          <MediaUploadDropzone
            ownerType={isPersonal ? "PERSONAL" : "ORGANIZATION"}
            ownerId={currentContext.actor_id}
            visibility="TRANSACTION_EVIDENCE"
            label="Kéo thả tài liệu / bản vẽ để kiểm tra tải trực tiếp lên Storage"
            helperText="Hệ thống tự động cấp Pre-signed PUT URL và băm SHA-256 xác thực"
            onUploadSuccess={(asset) => {
              alert(`Tải lên thành công!\nAsset ID: ${asset.id}\nObject Key: ${asset.object_key}\nSHA-256: ${asset.sha256_hash || 'Tạo tự động'}`);
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateOrgModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
      />
      <PersonalTeamNoticeModal
        isOpen={showPersonalTeamModal}
        onClose={() => setShowPersonalTeamModal(false)}
        onCreateOrg={() => setShowCreateOrgModal(true)}
      />
    </div>
  );
}
