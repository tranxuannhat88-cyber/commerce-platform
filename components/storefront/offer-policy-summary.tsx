"use client";

import React from "react";
import { Truck, RotateCcw, ShieldCheck, CreditCard, Store as StoreIcon } from "lucide-react";
import { StorePaymentSettings, StoreFulfillmentSettings, StorePolicySettings, PaymentMethodType, FulfillmentMethodType } from "@/types";

interface OfferPolicySummaryProps {
  paymentSettings?: StorePaymentSettings;
  fulfillmentSettings?: StoreFulfillmentSettings;
  policies?: StorePolicySettings;
  onOpenPolicyModal?: (tab: "shipping" | "returns" | "warranty" | "payment") => void;
}

export function OfferPolicySummary({
  paymentSettings,
  fulfillmentSettings,
  policies,
  onOpenPolicyModal,
}: OfferPolicySummaryProps) {
  // 1. Resolve Payment Summary
  const enabledPaymentMethods = paymentSettings?.enabled_methods || ["VIETQR", "BANK_TRANSFER"];
  const paymentLabels: string[] = [];
  if (enabledPaymentMethods.includes("VIETQR")) paymentLabels.push("VietQR");
  if (enabledPaymentMethods.includes("BANK_TRANSFER") && !enabledPaymentMethods.includes("VIETQR")) paymentLabels.push("Chuyển khoản");
  if (enabledPaymentMethods.includes("COD")) paymentLabels.push("COD");
  if (enabledPaymentMethods.includes("PAY_AT_STORE")) paymentLabels.push("Tại quầy");
  if (enabledPaymentMethods.includes("DEPOSIT")) paymentLabels.push("Đặt cọc");
  if (enabledPaymentMethods.includes("PAY_LATER")) paymentLabels.push("Công nợ");

  const paymentText = paymentLabels.length > 0 ? paymentLabels.slice(0, 3).join(", ") : "Thanh toán an toàn";

  // 2. Resolve Fulfillment / Shipping Summary
  const enabledFulfillmentMethods = fulfillmentSettings?.enabled_methods || ["DELIVERY"];
  const shippingLabels: string[] = [];
  if (enabledFulfillmentMethods.includes("DELIVERY") || enabledFulfillmentMethods.includes("SELLER_DELIVERY")) {
    shippingLabels.push("Giao hàng tận nơi");
  }
  if (enabledFulfillmentMethods.includes("EXPRESS_DELIVERY")) {
    shippingLabels.push("Hỏa tốc");
  }
  if (enabledFulfillmentMethods.includes("STORE_PICKUP")) {
    shippingLabels.push("Nhận tại cửa hàng");
  }
  if (enabledFulfillmentMethods.includes("SHIPPING_QUOTE_LATER")) {
    shippingLabels.push("Báo phí vận chuyển sau");
  }

  const shippingText = shippingLabels.length > 0 ? shippingLabels.slice(0, 2).join(" • ") : "Giao hàng";

  // 3. Resolve Policies (Only show if actually configured!)
  const hasReturnPolicy = Boolean(policies?.return_policy && policies.return_policy.trim().length > 0);
  const hasWarrantyPolicy = Boolean(policies?.warranty_policy && policies.warranty_policy.trim().length > 0);

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 flex flex-wrap items-center justify-around gap-2 text-xs shadow-2xs">
      {/* Shipping Item */}
      <button
        type="button"
        onClick={() => onOpenPolicyModal && onOpenPolicyModal("shipping")}
        className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <Truck className="w-4 h-4 text-blue-600 shrink-0" />
        <span>{shippingText}</span>
      </button>

      {/* Payment Item */}
      <button
        type="button"
        onClick={() => onOpenPolicyModal && onOpenPolicyModal("payment")}
        className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-amber-600 font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
        <span>{paymentText}</span>
      </button>

      {/* Returns Item (Only if seller has return policy) */}
      {hasReturnPolicy && (
        <button
          type="button"
          onClick={() => onOpenPolicyModal && onOpenPolicyModal("returns")}
          className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Chính sách đổi trả</span>
        </button>
      )}

      {/* Warranty Item (Only if seller has warranty policy) */}
      {hasWarrantyPolicy && (
        <button
          type="button"
          onClick={() => onOpenPolicyModal && onOpenPolicyModal("warranty")}
          className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 hover:text-purple-600 font-bold transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Bảo hành cam kết</span>
        </button>
      )}
    </div>
  );
}
