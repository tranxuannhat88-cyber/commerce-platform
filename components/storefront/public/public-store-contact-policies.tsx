"use client";

import React from "react";
import { Phone, Mail, MapPin, Globe, MessageCircle, Truck, RotateCcw, ShieldCheck, CreditCard, HelpCircle } from "lucide-react";

interface PublicStoreContactPoliciesProps {
  storeName: string;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    zaloPhone?: string;
    websiteUrl?: string;
  };
  policies: {
    shippingPolicy?: string;
    returnPolicy?: string;
    warrantyPolicy?: string;
    paymentTerms?: string;
  };
  paymentMethods?: string[];
  fulfillmentMethods?: string[];
  brandColor?: string;
}

export function PublicStoreContactPolicies({
  storeName,
  contact,
  policies,
  paymentMethods = [],
  fulfillmentMethods = [],
  brandColor = "#2563eb",
}: PublicStoreContactPoliciesProps) {
  const hasContact = Boolean(
    contact.phone || contact.email || contact.address || contact.zaloPhone || contact.websiteUrl
  );

  const hasPolicies = Boolean(
    policies.shippingPolicy || policies.returnPolicy || policies.warrantyPolicy || policies.paymentTerms
  );

  const hasPaymentOrShipping = paymentMethods.length > 0 || fulfillmentMethods.length > 0;

  if (!hasContact && !hasPolicies && !hasPaymentOrShipping) {
    return null;
  }

  return (
    <section id="contact" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. CONTACT CHANNELS */}
      {hasContact && (
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color: brandColor }} />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Thông Tin Liên Hệ
            </h3>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            {contact.phone && (
              <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Điện thoại:</span>
                <a
                  href={`tel:${contact.phone}`}
                  className="font-bold text-neutral-900 dark:text-neutral-100 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
            )}

            {contact.zaloPhone && (
              <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
                <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Zalo tư vấn:</span>
                <a
                  href={`https://zalo.me/${contact.zaloPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Chat Zalo ({contact.zaloPhone}) ↗
                </a>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Email:</span>
                <a
                  href={`mailto:${contact.email}`}
                  className="font-medium text-neutral-900 dark:text-neutral-100 hover:underline truncate"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {contact.address && (
              <div className="flex items-start gap-2.5 text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-500">Địa chỉ: </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{contact.address}</span>
                </div>
              </div>
            )}

            {contact.websiteUrl && (
              <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
                <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Website:</span>
                <a
                  href={contact.websiteUrl.startsWith("http") ? contact.websiteUrl : `https://${contact.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {contact.websiteUrl} ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. REAL POLICIES & FULFILLMENT / PAYMENT METHODS */}
      {(hasPolicies || hasPaymentOrShipping) && (
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: brandColor }} />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Phương Thức & Chính Sách
            </h3>
          </div>

          {/* Payment & Fulfillment Badges */}
          {hasPaymentOrShipping && (
            <div className="space-y-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              {paymentMethods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-400">Thanh toán:</span>
                  {paymentMethods.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px] border border-blue-200/60"
                    >
                      {m === "VIETQR" ? "VietQR (Napas247)" : m === "COD" ? "Tiền mặt khi nhận (COD)" : m}
                    </span>
                  ))}
                </div>
              )}

              {fulfillmentMethods.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-400">Giao nhận:</span>
                  {fulfillmentMethods.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200/60"
                    >
                      {m === "DELIVERY"
                        ? "Giao hàng tận nơi"
                        : m === "STORE_PICKUP"
                        ? "Nhận tại cửa hàng"
                        : m === "SHIPPING_QUOTE_LATER"
                        ? "Báo phí giao sau"
                        : m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configured Policies */}
          <div className="space-y-2.5 text-xs leading-relaxed">
            {policies.shippingPolicy && (
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                  📦 Vận chuyển:
                </span>
                <p className="text-neutral-500 dark:text-neutral-400">{policies.shippingPolicy}</p>
              </div>
            )}

            {policies.returnPolicy && (
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                  🔄 Đổi trả:
                </span>
                <p className="text-neutral-500 dark:text-neutral-400">{policies.returnPolicy}</p>
              </div>
            )}

            {policies.warrantyPolicy && (
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                  🛡️ Bảo hành:
                </span>
                <p className="text-neutral-500 dark:text-neutral-400">{policies.warrantyPolicy}</p>
              </div>
            )}

            {policies.paymentTerms && (
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-0.5">
                  💳 Điều khoản thanh toán:
                </span>
                <p className="text-neutral-500 dark:text-neutral-400">{policies.paymentTerms}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
