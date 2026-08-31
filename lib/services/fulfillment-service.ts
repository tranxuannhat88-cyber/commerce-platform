import {
  Store,
  Offer,
  FulfillmentMethodType,
  ShippingFeeRuleType,
  StoreFulfillmentSettings,
  OfferFulfillmentOverride,
  OrderFulfillmentSnapshot,
  ShippingZone,
} from "@/types";

export const DEFAULT_STORE_FULFILLMENT_SETTINGS: StoreFulfillmentSettings = {
  store_id: "default-store",
  enabled_methods: ["DELIVERY", "STORE_PICKUP"],
  default_method: "DELIVERY",
  fee_rule_type: "FIXED",
  fixed_fee: 30000,
  free_shipping_threshold: 500000,
  pickup_config: {
    store_name: "Showroom Chính 2K Tech",
    address: "Tòa nhà TechHub, Số 12 Khu Công Nghệ Cao, Q.9, TP.HCM",
    business_hours: "08:00 - 18:00 (T2 - T7)",
    instructions: "Quý khách vui lòng cung cấp Mã Đơn Hàng cho nhân viên quầy giao dịch để nhận kiện hàng.",
  },
  zones: [
    {
      id: "zone-hcm",
      organization_id: "org-2k-tech",
      store_id: "default-store",
      name: "Nội thành TP.HCM",
      provinces: ["Hồ Chí Minh", "TP.HCM", "TP Hồ Chí Minh"],
      shipping_fee: 25000,
      free_shipping_threshold: 400000,
      estimated_days: "1 ngày",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "zone-hn",
      organization_id: "org-2k-tech",
      store_id: "default-store",
      name: "Hà Nội & Hải Phòng",
      provinces: ["Hà Nội", "Hải Phòng"],
      shipping_fee: 35000,
      free_shipping_threshold: 600000,
      estimated_days: "2 ngày",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "zone-other",
      organization_id: "org-2k-tech",
      store_id: "default-store",
      name: "Các tỉnh thành khác",
      provinces: ["Tỉnh khác", "Toàn quốc"],
      shipping_fee: 45000,
      free_shipping_threshold: 800000,
      estimated_days: "2-4 ngày",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

export class FulfillmentService {
  /**
   * Resolve Store Fulfillment Settings
   */
  static getStoreFulfillmentSettings(store: Store): StoreFulfillmentSettings {
    if (store.advanced_fulfillment_settings) {
      return store.advanced_fulfillment_settings;
    }

    const enabled: FulfillmentMethodType[] = [];
    if (store.shipping_settings?.shipping_enabled !== false) enabled.push("DELIVERY");
    if (store.shipping_settings?.enable_store_pickup) enabled.push("STORE_PICKUP");
    if (store.shipping_settings?.enable_quote_later) enabled.push("SHIPPING_QUOTE_LATER");

    return {
      store_id: store.id,
      enabled_methods: enabled.length > 0 ? enabled : ["DELIVERY", "STORE_PICKUP"],
      default_method: "DELIVERY",
      fee_rule_type: "FIXED",
      fixed_fee: store.shipping_settings?.default_fixed_fee ?? 30000,
      free_shipping_threshold: store.shipping_settings?.free_shipping_threshold ?? 500000,
      pickup_config: {
        store_name: store.store_name,
        address: store.shipping_settings?.pickup_address || store.address || "Showroom chính của Cửa hàng",
        business_hours: "08:30 - 18:00 (T2 - T7)",
        instructions: store.shipping_settings?.pickup_instructions || "Xuất trình Mã Đơn Hàng cho nhân viên quầy.",
      },
      zones: DEFAULT_STORE_FULFILLMENT_SETTINGS.zones,
    };
  }

  /**
   * Resolve Effective Fulfillment Methods for Checkout
   */
  static getEffectiveFulfillmentMethods(
    store: Store,
    offer?: Offer,
    subtotal: number = 0,
    province?: string
  ): {
    methods: Array<{
      type: FulfillmentMethodType;
      name: string;
      description?: string;
      shipping_fee: number;
      is_free: boolean;
      original_fee: number;
      discount: number;
      estimated_delivery?: string;
      is_quote_later?: boolean;
    }>;
    fulfillment_mode: 'STORE_DEFAULT' | 'OFFER_OVERRIDE';
    pickup_config?: StoreFulfillmentSettings['pickup_config'];
  } {
    const storeSettings = this.getStoreFulfillmentSettings(store);
    const isOverride = offer?.fulfillment_override?.mode === 'OFFER_OVERRIDE';

    // 1. Resolve Enabled Methods
    let activeMethods: FulfillmentMethodType[] = [];
    if (isOverride && offer?.fulfillment_override?.enabled_methods && offer.fulfillment_override.enabled_methods.length > 0) {
      activeMethods = offer.fulfillment_override.enabled_methods;
    } else {
      activeMethods = storeSettings.enabled_methods;
    }

    // 2. Resolve Fee Rule and Base Fee
    const feeRuleType: ShippingFeeRuleType = isOverride && offer?.fulfillment_override?.fee_rule_type
      ? offer.fulfillment_override.fee_rule_type
      : storeSettings.fee_rule_type;

    const baseFixedFee = isOverride && offer?.fulfillment_override?.fixed_fee !== undefined
      ? offer.fulfillment_override.fixed_fee
      : storeSettings.fixed_fee;

    const freeThreshold = isOverride && offer?.fulfillment_override?.free_shipping_threshold !== undefined
      ? offer.fulfillment_override.free_shipping_threshold
      : storeSettings.free_shipping_threshold;

    // 3. Map methods with calculated fees
    const methods = activeMethods.map((type) => {
      let name = "Giao hàng tiêu chuẩn";
      let desc = "Giao hàng tận nơi toàn quốc";
      let calculatedFee = 0;
      let originalFee = 0;
      let isQuoteLater = false;
      let estimated = "2 - 3 ngày";

      switch (type) {
        case "STORE_PICKUP":
          name = "Nhận tại cửa hàng / Showroom";
          desc = storeSettings.pickup_config?.address || "Nhận trực tiếp tại showroom người bán";
          calculatedFee = 0;
          originalFee = 0;
          estimated = "Có sẵn trong ngày";
          break;

        case "SHIPPING_QUOTE_LATER":
          name = "Báo phí giao hàng sau";
          desc = "Người bán sẽ tính toán chi phí vận tải tối ưu và báo lại sau khi nhận đơn";
          calculatedFee = 0;
          originalFee = 0;
          isQuoteLater = true;
          estimated = "Báo sau";
          break;

        case "DELIVERY":
        case "SELLER_DELIVERY":
        case "EXPRESS_DELIVERY":
        case "CARRIER":
          if (type === "EXPRESS_DELIVERY") {
            name = "Giao hàng hỏa tốc";
            desc = "Giao nhanh trong vòng 2 - 4 giờ làm việc";
            originalFee = baseFixedFee + 30000;
            estimated = "2 - 4 giờ";
          } else if (type === "SELLER_DELIVERY") {
            name = "Người bán tự vận chuyển";
            desc = "Nhân viên kỹ thuật của người bán trực tiếp giao & lắp đặt";
            originalFee = baseFixedFee;
            estimated = "1 - 2 ngày";
          } else {
            name = "Giao hàng tiêu chuẩn";
            desc = "Giao tận tay qua đối tác vận chuyển chuyên nghiệp";
            originalFee = baseFixedFee;
            estimated = "2 - 3 ngày";
          }

          // Fee rule resolution
          if (feeRuleType === "FREE") {
            calculatedFee = 0;
          } else if (feeRuleType === "FREE_THRESHOLD" || freeThreshold) {
            if (freeThreshold && subtotal >= freeThreshold) {
              calculatedFee = 0;
            } else {
              calculatedFee = originalFee;
            }
          } else if (feeRuleType === "ZONE" && province) {
            const matchedZone = storeSettings.zones.find((z) =>
              z.provinces.some((p) => province.toLowerCase().includes(p.toLowerCase()))
            ) || storeSettings.zones[storeSettings.zones.length - 1];

            if (matchedZone) {
              originalFee = matchedZone.shipping_fee;
              if (matchedZone.free_shipping_threshold && subtotal >= matchedZone.free_shipping_threshold) {
                calculatedFee = 0;
              } else {
                calculatedFee = originalFee;
              }
              if (matchedZone.estimated_days) estimated = matchedZone.estimated_days;
            } else {
              calculatedFee = originalFee;
            }
          } else {
            calculatedFee = originalFee;
          }
          break;

        default:
          name = type;
      }

      const discount = Math.max(0, originalFee - calculatedFee);

      return {
        type,
        name,
        description: desc,
        shipping_fee: calculatedFee,
        is_free: calculatedFee === 0 && type !== "SHIPPING_QUOTE_LATER",
        original_fee: originalFee,
        discount,
        estimated_delivery: estimated,
        is_quote_later: isQuoteLater,
      };
    });

    return {
      methods,
      fulfillment_mode: isOverride ? 'OFFER_OVERRIDE' : 'STORE_DEFAULT',
      pickup_config: storeSettings.pickup_config,
    };
  }

  /**
   * Create Immutable Order Fulfillment Snapshot
   */
  static createOrderFulfillmentSnapshot(
    methodType: FulfillmentMethodType,
    store: Store,
    offer?: Offer,
    subtotal: number = 0,
    province?: string
  ): OrderFulfillmentSnapshot {
    const res = this.getEffectiveFulfillmentMethods(store, offer, subtotal, province);
    const chosen = res.methods.find((m) => m.type === methodType) || res.methods[0];

    const feeRuleType: ShippingFeeRuleType = offer?.fulfillment_override?.mode === 'OFFER_OVERRIDE' && offer.fulfillment_override.fee_rule_type
      ? offer.fulfillment_override.fee_rule_type
      : store.advanced_fulfillment_settings?.fee_rule_type || "FIXED";

    return {
      method_type: chosen.type,
      method_name: chosen.name,
      fee_rule_type: feeRuleType,
      base_shipping_fee: chosen.original_fee,
      shipping_discount: chosen.discount,
      final_shipping_fee: chosen.shipping_fee,
      pickup_location: chosen.type === 'STORE_PICKUP' ? res.pickup_config?.address : undefined,
      pickup_instructions: chosen.type === 'STORE_PICKUP' ? res.pickup_config?.instructions : undefined,
      zone_name: province,
      estimated_delivery: chosen.estimated_delivery,
    };
  }
}
