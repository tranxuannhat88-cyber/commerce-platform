import {
  Store,
  Offer,
  ActorPaymentAccount,
  PaymentMethodType,
  StorePaymentSettings,
  StorePaymentMethodConfig,
  OfferPaymentOverride,
  OrderPaymentSnapshot,
  FulfillmentMethodType,
} from "@/types";

export const DEFAULT_STORE_PAYMENT_METHODS: StorePaymentMethodConfig[] = [
  {
    id: "spm-vietqr",
    method_type: "VIETQR",
    name: "Chuyển khoản / VietQR Tự Động",
    is_enabled: true,
    display_order: 1,
    custom_instructions: "Quét mã VietQR chuyển khoản tự động xử lý đơn hàng tức thì.",
  },
  {
    id: "spm-cod",
    method_type: "COD",
    name: "Thanh toán khi nhận hàng (COD)",
    is_enabled: true,
    display_order: 2,
    custom_instructions: "Thanh toán tiền mặt hoặc quẹt thẻ cho nhân viên giao hàng.",
  },
  {
    id: "spm-pay-at-store",
    method_type: "PAY_AT_STORE",
    name: "Thanh toán tại cửa hàng / quầy",
    is_enabled: true,
    display_order: 3,
    custom_instructions: "Thanh toán trực tiếp bằng tiền mặt, thẻ hoặc QR tại showroom khi nhận hàng.",
  },
  {
    id: "spm-deposit",
    method_type: "DEPOSIT",
    name: "Đặt cọc trước (Deposit)",
    is_enabled: false,
    display_order: 4,
    deposit_percentage: 30,
    custom_instructions: "Đặt cọc phần trăm hoặc số tiền cố định khi đặt hàng, số tiền còn lại thanh toán khi nhận hàng.",
  },
  {
    id: "spm-pay-later",
    method_type: "PAY_LATER",
    name: "Thanh toán sau (Pay Later / Công nợ)",
    is_enabled: false,
    display_order: 5,
    pay_later_terms: "NET_30",
    pay_later_days: 30,
    custom_instructions: "Mua hàng trước, thanh toán công nợ theo kỳ hạn quy định.",
  },
];

export class PaymentSettingsService {
  /**
   * Resolve Store Payment Settings (fallback to sensible defaults if uninitialized)
   */
  static getStorePaymentSettings(store: Store): StorePaymentSettings {
    if (store.advanced_payment_settings) {
      return store.advanced_payment_settings;
    }

    const defaultConfigs: Record<PaymentMethodType, Partial<StorePaymentMethodConfig>> = {
      VIETQR: { id: "spm-vietqr", method_type: "VIETQR", name: "Chuyển khoản / VietQR Tự Động", is_enabled: true, display_order: 1 },
      BANK_TRANSFER: { id: "spm-bank", method_type: "BANK_TRANSFER", name: "Chuyển khoản ngân hàng thủ công", is_enabled: false, display_order: 2 },
      COD: { id: "spm-cod", method_type: "COD", name: "Thanh toán khi nhận hàng (COD)", is_enabled: store.payment_settings?.enable_cod ?? true, display_order: 3 },
      PAY_AT_STORE: { id: "spm-store", method_type: "PAY_AT_STORE", name: "Thanh toán tại cửa hàng", is_enabled: store.shipping_settings?.enable_store_pickup ?? true, display_order: 4 },
      DEPOSIT: { id: "spm-deposit", method_type: "DEPOSIT", name: "Đặt cọc trước", is_enabled: false, display_order: 5, deposit_percentage: 30 },
      PAY_LATER: { id: "spm-pay-later", method_type: "PAY_LATER", name: "Thanh toán sau (NET 30)", is_enabled: false, display_order: 6, pay_later_terms: "NET_30", pay_later_days: 30 },
      ONLINE_GATEWAY: { id: "spm-gateway", method_type: "ONLINE_GATEWAY", name: "Cổng thanh toán trực tuyến", is_enabled: false, display_order: 7 },
      OTHER: { id: "spm-other", method_type: "OTHER", name: "Phương thức khác", is_enabled: false, display_order: 8 },
    };

    const enabledMethods: PaymentMethodType[] = [];
    if (store.payment_settings?.enable_bank_transfer !== false) enabledMethods.push("VIETQR");
    if (store.payment_settings?.enable_cod !== false) enabledMethods.push("COD");
    if (store.shipping_settings?.enable_store_pickup) enabledMethods.push("PAY_AT_STORE");

    return {
      store_id: store.id,
      enabled_methods: enabledMethods.length > 0 ? enabledMethods : ["VIETQR", "COD"],
      method_configs: defaultConfigs,
      allow_offer_override: true,
    };
  }

  /**
   * Resolve Effective Payment Methods for Buyer Checkout
   * Priority: Offer Override (if active) -> Store Defaults
   */
  static getEffectivePaymentMethods(
    store: Store,
    offer?: Offer,
    accounts: ActorPaymentAccount[] = []
  ): {
    methods: Array<{
      type: PaymentMethodType;
      name: string;
      description?: string;
      account?: ActorPaymentAccount;
      deposit?: { type: 'PERCENTAGE' | 'FIXED_AMOUNT'; percentage?: number; fixed_amount?: number };
      pay_later?: { terms: string; days: number; due_date_basis: string };
    }>;
    payment_mode: 'STORE_DEFAULT' | 'OFFER_OVERRIDE';
    active_account?: ActorPaymentAccount;
  } {
    const storeSettings = this.getStorePaymentSettings(store);
    const isOverride = offer?.payment_override?.mode === 'OFFER_OVERRIDE';

    // 1. Resolve Target Payment Account
    let activeAccount: ActorPaymentAccount | undefined;
    if (isOverride && offer?.payment_override?.custom_payment_account_id) {
      activeAccount = accounts.find((a) => a.id === offer.payment_override?.custom_payment_account_id);
    }
    if (!activeAccount && storeSettings.default_payment_account_id) {
      activeAccount = accounts.find((a) => a.id === storeSettings.default_payment_account_id);
    }
    if (!activeAccount) {
      activeAccount = accounts.find((a) => a.is_default) || accounts[0];
    }
    // Fallback to store legacy bank credentials if no actor account matched
    if (!activeAccount && store.payment_settings?.bank_account_no) {
      activeAccount = {
        id: `legacy-${store.id}`,
        actor_id: store.organization_id || store.owner_actor_id || store.id,
        actor_type: store.owner_actor_type || 'ORGANIZATION',
        bank_bin: store.payment_settings.bank_bin || '970422',
        bank_name: store.payment_settings.bank_name || 'MBBank',
        bank_short_name: store.payment_settings.bank_name || 'MBBank',
        account_number: store.payment_settings.bank_account_no,
        account_name: store.payment_settings.bank_account_name || store.store_name,
        is_default: true,
        verification_status: 'VERIFIED',
        created_at: store.created_at,
        updated_at: store.updated_at,
      };
    }

    // 2. Resolve Active Payment Method Types
    let activeTypes: PaymentMethodType[] = [];
    if (isOverride && offer?.payment_override?.enabled_methods && offer.payment_override.enabled_methods.length > 0) {
      activeTypes = offer.payment_override.enabled_methods;
    } else {
      activeTypes = storeSettings.enabled_methods;
    }

    // 3. Assemble method list with rich options
    const methods = activeTypes.map((type) => {
      let name = "Phương thức thanh toán";
      let desc = "";

      switch (type) {
        case "VIETQR":
          name = "Chuyển khoản / VietQR";
          desc = activeAccount ? `Quét mã VietQR qua ${activeAccount.bank_short_name}` : "Chuyển khoản tự động";
          break;
        case "COD":
          name = "Thanh toán khi nhận hàng (COD)";
          desc = "Thanh toán tiền mặt cho bưu tá khi nhận kiện hàng";
          break;
        case "PAY_AT_STORE":
          name = "Thanh toán tại cửa hàng";
          desc = "Thanh toán trực tiếp khi nhận hàng tại quầy / showroom";
          break;
        case "DEPOSIT":
          name = isOverride && offer?.payment_override?.deposit_percentage
            ? `Đặt cọc trước ${offer.payment_override.deposit_percentage}%`
            : "Đặt cọc trước";
          desc = "Thanh toán cọc để xác nhận đơn, phần còn lại thanh toán khi nhận hàng";
          break;
        case "PAY_LATER":
          name = isOverride && offer?.payment_override?.pay_later_terms
            ? `Thanh toán sau (${offer.payment_override.pay_later_terms.replace("_", " ")})`
            : "Thanh toán sau (Công nợ)";
          desc = "Nhận hàng trước, thanh toán công nợ theo kỳ hạn";
          break;
        case "BANK_TRANSFER":
          name = "Chuyển khoản ngân hàng";
          desc = "Chuyển khoản thủ công theo thông tin người bán";
          break;
        default:
          name = type;
      }

      return {
        type,
        name,
        description: desc,
        account: activeAccount,
        deposit: isOverride && offer?.payment_override?.deposit_type ? {
          type: offer.payment_override.deposit_type,
          percentage: offer.payment_override.deposit_percentage,
          fixed_amount: offer.payment_override.deposit_fixed_amount,
        } : undefined,
        pay_later: isOverride && offer?.payment_override?.pay_later_terms ? {
          terms: offer.payment_override.pay_later_terms,
          days: offer.payment_override.pay_later_days || 30,
          due_date_basis: offer.payment_override.pay_later_due_date_basis || "ORDER_CONFIRMATION",
        } : undefined,
      };
    });

    return {
      methods,
      payment_mode: isOverride ? 'OFFER_OVERRIDE' : 'STORE_DEFAULT',
      active_account: activeAccount,
    };
  }

  /**
   * Calculate Deposit Amount
   */
  static calculateDepositAmount(
    orderTotal: number,
    depositType: 'PERCENTAGE' | 'FIXED_AMOUNT' = 'PERCENTAGE',
    percentage: number = 30,
    fixedAmount: number = 0
  ): { depositPayable: number; remainingBalance: number } {
    if (orderTotal <= 0) return { depositPayable: 0, remainingBalance: 0 };

    let deposit = 0;
    if (depositType === 'PERCENTAGE') {
      const validPct = Math.max(1, Math.min(100, percentage));
      deposit = Math.round((orderTotal * validPct) / 100);
    } else {
      deposit = Math.min(orderTotal, Math.max(1, fixedAmount));
    }

    const remaining = Math.max(0, orderTotal - deposit);
    return { depositPayable: deposit, remainingBalance: remaining };
  }

  /**
   * Calculate Payment Due Date
   */
  static calculatePaymentDueDate(
    orderDateIso: string,
    terms: 'NET_7' | 'NET_15' | 'NET_30' | 'NET_45' | 'CUSTOM' = 'NET_30',
    customDays: number = 30
  ): string {
    const baseDate = new Date(orderDateIso);
    let days = 30;
    switch (terms) {
      case 'NET_7': days = 7; break;
      case 'NET_15': days = 15; break;
      case 'NET_30': days = 30; break;
      case 'NET_45': days = 45; break;
      case 'CUSTOM': days = Math.max(1, customDays); break;
    }
    const dueDate = new Date(baseDate.getTime() + days * 86400000);
    return dueDate.toISOString();
  }

  /**
   * Validate compatibility between selected payment method and fulfillment method
   */
  static validatePaymentFulfillmentCompatibility(
    paymentMethod: PaymentMethodType,
    fulfillmentMethod: FulfillmentMethodType
  ): { isValid: boolean; errorMessage?: string } {
    if (paymentMethod === 'PAY_AT_STORE' && fulfillmentMethod !== 'STORE_PICKUP') {
      return {
        isValid: false,
        errorMessage: "Phương thức 'Thanh toán tại cửa hàng' chỉ áp dụng khi nhận hàng tại Showroom/Kho.",
      };
    }

    if (paymentMethod === 'COD' && fulfillmentMethod === 'STORE_PICKUP') {
      return {
        isValid: false,
        errorMessage: "Khi nhận hàng tại cửa hàng, vui lòng chọn 'Thanh toán tại cửa hàng' hoặc 'VietQR'.",
      };
    }

    if (paymentMethod === 'COD' && (fulfillmentMethod === 'DIGITAL' || fulfillmentMethod === 'NO_DELIVERY')) {
      return {
        isValid: false,
        errorMessage: "Sản phẩm số hoặc dịch vụ không áp dụng hình thức thu tiền COD.",
      };
    }

    return { isValid: true };
  }

  /**
   * Create Immutable Order Payment Snapshot
   */
  static createOrderPaymentSnapshot(
    paymentMethod: PaymentMethodType,
    orderTotal: number,
    account?: ActorPaymentAccount,
    offerOverride?: OfferPaymentOverride
  ): OrderPaymentSnapshot {
    let depositAmount: number | undefined;
    let remainingAmount: number | undefined;
    let dueDate: string | undefined;

    if (paymentMethod === 'DEPOSIT') {
      const depositType = offerOverride?.deposit_type || 'PERCENTAGE';
      const pct = offerOverride?.deposit_percentage || 30;
      const fixed = offerOverride?.deposit_fixed_amount || 0;
      const calc = this.calculateDepositAmount(orderTotal, depositType, pct, fixed);
      depositAmount = calc.depositPayable;
      remainingAmount = calc.remainingBalance;
    }

    if (paymentMethod === 'PAY_LATER') {
      const terms = offerOverride?.pay_later_terms || 'NET_30';
      const days = offerOverride?.pay_later_days || 30;
      dueDate = this.calculatePaymentDueDate(new Date().toISOString(), terms, days);
    }

    let methodName = "Chuyển khoản VietQR";
    switch (paymentMethod) {
      case 'VIETQR': methodName = "Chuyển khoản / VietQR Tự Động"; break;
      case 'COD': methodName = "Thanh toán khi nhận hàng (COD)"; break;
      case 'PAY_AT_STORE': methodName = "Thanh toán tại cửa hàng"; break;
      case 'DEPOSIT': methodName = `Đặt cọc trước (${depositAmount ? depositAmount.toLocaleString('vi-VN') + 'đ' : '30%'})`; break;
      case 'PAY_LATER': methodName = `Thanh toán sau (${offerOverride?.pay_later_terms || 'NET 30'})`; break;
      case 'BANK_TRANSFER': methodName = "Chuyển khoản ngân hàng thủ công"; break;
      default: methodName = paymentMethod;
    }

    return {
      method_type: paymentMethod,
      method_name: methodName,
      payment_status: paymentMethod === 'COD' ? 'COD_PENDING' : 'UNPAID',
      terms: offerOverride?.pay_later_terms,
      deposit_type: offerOverride?.deposit_type,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      payment_due_date: dueDate,
      due_date_basis: offerOverride?.pay_later_due_date_basis || 'ORDER_CONFIRMATION',
      bank_account_snapshot: account ? {
        bank_bin: account.bank_bin,
        bank_name: account.bank_name,
        bank_short_name: account.bank_short_name,
        account_number: account.account_number,
        account_name: account.account_name,
      } : undefined,
    };
  }
}
