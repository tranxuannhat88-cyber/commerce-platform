"use client";

import React from "react";
import { Phone, Mail, MapPin, Clock, Building2, Store as StoreIcon } from "lucide-react";
import { Store, Organization } from "@/types";

interface TemplateAboutContactProps {
  store: Store;
  organization?: Organization;
  brandColor?: string;
}

export function TemplateAboutContact({ store, organization, brandColor = "#2563eb" }: TemplateAboutContactProps) {
  return (
    <section id="contact" className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
      {/* About Block */}
      <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <StoreIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Về Chúng Tôi
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {store.description ||
            "Chúng tôi cam kết cung cấp các sản phẩm và dịch vụ đạt tiêu chuẩn chất lượng cao nhất, mang lại sự hài lòng và trải nghiệm mua sắm an tâm tuyệt đối cho khách hàng."}
        </p>

        {organization && organization.name && (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-500">
            <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Pháp nhân: <strong className="text-neutral-800 dark:text-neutral-200">{organization.name}</strong></span>
          </div>
        )}
      </div>

      {/* Contact & Hours Block */}
      <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <Phone className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Thông Tin Liên Hệ & Hỗ Trợ
          </h3>
        </div>

        <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
          {store.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>{store.address}</span>
            </div>
          )}

          {store.phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
              <a href={`tel:${store.phone}`} className="font-bold text-blue-600 hover:underline">
                {store.phone}
              </a>
            </div>
          )}

          {store.email && (
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <a href={`mailto:${store.email}`} className="text-neutral-800 dark:text-neutral-200 hover:underline">
                {store.email}
              </a>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Giờ làm việc: 08:00 – 21:00 (Thứ 2 – Chủ Nhật)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
