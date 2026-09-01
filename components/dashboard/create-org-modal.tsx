"use client";

import React, { useState } from "react";
import {
  Building2,
  X,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Users,
} from "lucide-react";
import { OrganizationType } from "@/types";
import { useCommerceStore } from "@/lib/db/store";
import confetti from "canvas-confetti";

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orgId: string) => void;
}

export function CreateOrgModal({ isOpen, onClose, onSuccess }: CreateOrgModalProps) {
  const { createOrganization } = useCommerceStore();

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [orgType, setOrgType] = useState<OrganizationType>("COMPANY");
  const [taxCode, setTaxCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập Tên đầy đủ của Tổ chức hoặc Doanh nghiệp.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const newOrg = createOrganization({
        name: name.trim(),
        short_name: shortName.trim() || undefined,
        org_type: orgType,
        tax_code: taxCode.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess(newOrg.id);
    } catch (err: any) {
      setErrorMsg(err?.message || "Đã xảy ra lỗi khi tạo tổ chức.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-7 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Tạo Tổ Chức / Doanh Nghiệp
              </h3>
              <p className="text-xs text-neutral-500">
                Không gian làm việc cho nhiều người tham gia và phân quyền
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Tên đầy đủ & Tên viết tắt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Tên đầy đủ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Tên viết tắt / Brand
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Loại hình */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-2">
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

          {/* Thông tin bổ sung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Mã số thuế (Tùy chọn)
              </label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Hotline / Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Địa chỉ trụ sở / văn phòng
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
              />
            </div>
          </div>

          {/* Value proposition note */}
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-[11px] text-neutral-500 space-y-1">
            <p className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Quyền lợi khi tạo Tổ chức:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-neutral-600 dark:text-neutral-400">
              <li>Bạn là <strong>Owner</strong> và có thể mời nhân viên, phân quyền vai trò.</li>
              <li>Tự động nhận 1 gói <strong>FREE</strong> độc lập cho toàn bộ thành viên trong tổ chức.</li>
              <li>Có thể tạo nhiều Cửa hàng (Stores) riêng cho từng chi nhánh.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isSubmitting ? "Đang tạo..." : "Xác Nhận Tạo Tổ Chức"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
