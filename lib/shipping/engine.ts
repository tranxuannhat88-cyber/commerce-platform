import {
  Store,
  ShippingMethod,
  ShippingZone,
  ShippingMethodType,
  FulfillmentType,
  OrderShippingSnapshot,
} from '@/types';

export interface ShippingOption {
  method_id: string;
  method_type: ShippingMethodType;
  name: string;
  fee: number;
  original_fee: number;
  discount: number;
  estimated_delivery?: string;
  is_quote_later: boolean;
  description?: string;
}

export interface ShippingCalculationResult {
  requires_shipping: boolean;
  available_options: ShippingOption[];
  selected_option: ShippingOption | null;
  final_shipping_fee: number;
  currency: string;
}

export interface CartShippingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  offer_type?: string;
  fulfillment_type?: FulfillmentType;
  weight_grams?: number;
}

export interface ShippingCalculationInput {
  store: Store;
  items: CartShippingItem[];
  subtotal: number;
  delivery_address?: {
    province?: string;
    district?: string;
    ward?: string;
    address_line?: string;
    lat?: number;
    lng?: number;
  };
  selected_method_id?: string;
  shipping_methods?: ShippingMethod[];
  shipping_zones?: ShippingZone[];
}

export class ShippingCalculationService {
  public static calculate(input: ShippingCalculationInput): ShippingCalculationResult {
    const { store, items, subtotal, delivery_address, selected_method_id } = input;

    const hasPhysicalItems = items.some((it) => {
      if (it.fulfillment_type === 'DIGITAL' || it.fulfillment_type === 'ON_SITE_SERVICE' || it.fulfillment_type === 'NO_DELIVERY') {
        return false;
      }
      if (it.offer_type === 'SERVICE' || it.offer_type === 'DIGITAL_PRODUCT') return false;
      return true;
    });

    const isShippingGloballyDisabled = store.shipping_settings?.shipping_enabled === false;

    if (!hasPhysicalItems || isShippingGloballyDisabled) {
      const noShippingOption: ShippingOption = {
        method_id: 'no-shipping',
        method_type: 'FREE',
        name: !hasPhysicalItems ? 'Không yêu cầu vận chuyển (Dịch vụ / Số)' : 'Miễn phí vận chuyển',
        fee: 0,
        original_fee: 0,
        discount: 0,
        is_quote_later: false,
        description: 'Đơn hàng không phát sinh phí giao hàng vật lý.',
      };

      return {
        requires_shipping: false,
        available_options: [noShippingOption],
        selected_option: noShippingOption,
        final_shipping_fee: 0,
        currency: 'VND',
      };
    }

    let methods = input.shipping_methods && input.shipping_methods.length > 0
      ? input.shipping_methods.filter((m) => m.active)
      : [];

    if (methods.length === 0) {
      const defaultFixedFee = store.shipping_settings?.default_fixed_fee ?? 30000;
      const freeThreshold = store.shipping_settings?.free_shipping_threshold ?? 500000;

      methods = [
        {
          id: 'sm-standard',
          organization_id: store.organization_id,
          store_id: store.id,
          name: 'Giao hàng tiêu chuẩn',
          method_type: 'FREE_THRESHOLD',
          fixed_fee: defaultFixedFee,
          free_shipping_threshold: freeThreshold,
          estimated_days: '2 - 3 ngày',
          description: freeThreshold > 0 ? ('Miễn phí giao hàng cho đơn từ ' + freeThreshold.toLocaleString('vi-VN') + 'đ') : 'Giao hàng tận nơi',
          priority: 1,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      if (store.shipping_settings?.enable_store_pickup !== false) {
        methods.push({
          id: 'sm-pickup',
          organization_id: store.organization_id,
          store_id: store.id,
          name: 'Nhận tại cửa hàng / Xưởng',
          method_type: 'PICKUP',
          fixed_fee: 0,
          estimated_days: 'Trong ngày',
          description: store.shipping_settings?.pickup_address || store.address || 'Nhận trực tiếp tại địa chỉ người bán',
          priority: 2,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (store.shipping_settings?.enable_quote_later) {
        methods.push({
          id: 'sm-quote-later',
          organization_id: store.organization_id,
          store_id: store.id,
          name: 'Báo phí vận chuyển sau (Hàng cồng kềnh / Xe tải)',
          method_type: 'QUOTE_LATER',
          fixed_fee: 0,
          estimated_days: 'Xác nhận sau',
          description: 'Người bán sẽ liên hệ báo giá phí vận chuyển chính xác trước khi giao',
          priority: 3,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const available_options: ShippingOption[] = [];

    methods.forEach((m) => {
      if (m.min_order_value && subtotal < m.min_order_value) return;
      if (m.max_order_value && subtotal > m.max_order_value) return;

      let fee = m.fixed_fee ?? 30000;
      let original_fee = fee;
      let discount = 0;
      let is_quote_later = false;
      let description = m.description || '';

      switch (m.method_type) {
        case 'FREE':
          fee = 0;
          original_fee = 0;
          break;

        case 'FREE_THRESHOLD':
          const threshold = m.free_shipping_threshold ?? store.shipping_settings?.free_shipping_threshold ?? 500000;
          original_fee = m.fixed_fee ?? (store.shipping_settings?.default_fixed_fee ?? 30000);
          if (subtotal >= threshold) {
            fee = 0;
            discount = original_fee;
            description = 'Đã áp dụng Miễn phí ship cho đơn từ ' + threshold.toLocaleString('vi-VN') + 'đ';
          } else {
            fee = original_fee;
            const remaining = threshold - subtotal;
            description = 'Mua thêm ' + remaining.toLocaleString('vi-VN') + 'đ để được Miễn phí giao hàng';
          }
          break;

        case 'ZONE':
          const customerProvince = delivery_address?.province?.toLowerCase() || '';
          const zones = input.shipping_zones || [];
          const matchedZone = zones.find(
            (z) => z.is_active && z.provinces.some((p) => customerProvince.includes(p.toLowerCase()))
          );
          if (matchedZone) {
            original_fee = matchedZone.shipping_fee;
            if (matchedZone.free_shipping_threshold && subtotal >= matchedZone.free_shipping_threshold) {
              fee = 0;
              discount = original_fee;
              description = 'Khu vực ' + matchedZone.name + ': Miễn phí vận chuyển';
            } else {
              fee = original_fee;
              description = 'Khu vực: ' + matchedZone.name;
            }
          }
          break;

        case 'PICKUP':
          fee = 0;
          original_fee = 0;
          description = 'Địa chỉ lấy hàng: ' + (store.shipping_settings?.pickup_address || store.address || 'Liên hệ cửa hàng');
          break;

        case 'QUOTE_LATER':
          fee = 0;
          original_fee = 0;
          is_quote_later = true;
          description = 'Cửa hàng sẽ liên hệ báo giá phí ship trước khi bạn thanh toán.';
          break;

        default:
          fee = m.fixed_fee ?? 30000;
          original_fee = fee;
          break;
      }

      available_options.push({
        method_id: m.id,
        method_type: m.method_type,
        name: m.name,
        fee,
        original_fee,
        discount,
        estimated_delivery: m.estimated_days || '2 - 3 ngày',
        is_quote_later,
        description,
      });
    });

    let selected = available_options.find((o) => o.method_id === selected_method_id);
    if (!selected && available_options.length > 0) {
      selected = available_options.find((o) => o.method_type !== 'PICKUP') || available_options[0];
    }

    const final_fee = selected?.is_quote_later ? 0 : (selected?.fee ?? 0);

    return {
      requires_shipping: true,
      available_options,
      selected_option: selected || null,
      final_shipping_fee: final_fee,
      currency: 'VND',
    };
  }

  public static createSnapshot(
    selectedOption: ShippingOption | null,
    requiresShipping: boolean
  ): OrderShippingSnapshot {
    if (!requiresShipping || !selectedOption) {
      return {
        method_name: 'Không yêu cầu vận chuyển',
        method_type: 'FREE',
        fulfillment_type: 'NO_DELIVERY',
        shipping_fee: 0,
        shipping_fee_original: 0,
        shipping_discount: 0,
        shipping_status: 'NOT_REQUIRED',
      };
    }

    let fulfillment: FulfillmentType = 'SHIPPING';
    if (selectedOption.method_type === 'PICKUP') {
      fulfillment = 'PICKUP';
    }

    return {
      shipping_method_id: selectedOption.method_id,
      method_name: selectedOption.name,
      method_type: selectedOption.method_type,
      fulfillment_type: fulfillment,
      shipping_fee: selectedOption.fee,
      shipping_fee_original: selectedOption.original_fee,
      shipping_discount: selectedOption.discount,
      shipping_status: selectedOption.is_quote_later ? 'QUOTING' : 'READY',
      estimated_delivery: selectedOption.estimated_delivery,
      quote_notes: selectedOption.description,
      quoted_at: new Date().toISOString(),
    };
  }
}
