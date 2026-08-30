import {
  BillingOrder,
  BillingOrderItem,
  BillingOrderType,
  BillingPeriod,
  BillingPlanCode,
  BillingInvoice,
  Subscription,
  SubscriptionItem,
} from "./types";
import { BILLING_CONFIG, BILLING_PLANS } from "./plans-config";
import { BILLING_ADDONS } from "./addons-config";

export class BillingService {
  /**
   * Authoritative Server-side Order Calculation & Creation
   * Prevents any client price tampering by looking up real prices from plans-config & addons-config.
   */
  public static createBillingOrder({
    actorId,
    actorType,
    actorName,
    orderType,
    planCode,
    billingPeriod = "MONTHLY",
    addonSelections = [],
    promoCode,
  }: {
    actorId: string;
    actorType: "PERSONAL" | "ORGANIZATION";
    actorName: string;
    orderType: BillingOrderType;
    planCode?: BillingPlanCode;
    billingPeriod?: BillingPeriod;
    addonSelections?: { addonCode: string; quantity: number }[];
    promoCode?: string;
  }): BillingOrder {
    const orderItems: BillingOrderItem[] = [];
    let subtotal = 0;

    // 1. Calculate Base Plan if applicable
    if (planCode && planCode !== "FREE" && planCode !== "ENTERPRISE") {
      const plan = BILLING_PLANS[planCode];
      if (plan) {
        const price = plan.prices[billingPeriod].amount;
        orderItems.push({
          id: `item-plan-${Date.now()}`,
          billing_order_id: "",
          item_type: "PLAN",
          reference_id: plan.id,
          description: `Gói ${plan.name} (${
            billingPeriod === "ANNUAL" ? "12 Tháng - Tiết kiệm 2 tháng" : "Hàng Tháng"
          })`,
          quantity: 1,
          unit_price: price,
          amount: price,
        });
        subtotal += price;
      }
    }

    // 2. Calculate Add-ons
    addonSelections.forEach((sel) => {
      const addon = BILLING_ADDONS.find((a) => a.code === sel.addonCode);
      if (addon && sel.quantity > 0) {
        const itemAmount = addon.price * sel.quantity;
        orderItems.push({
          id: `item-addon-${addon.code}-${Date.now()}`,
          billing_order_id: "",
          item_type: "ADDON",
          reference_id: addon.id,
          description: `${addon.name} (x${sel.quantity})`,
          quantity: sel.quantity,
          unit_price: addon.price,
          amount: itemAmount,
        });
        subtotal += itemAmount;
      }
    });

    // 3. Discount calculation (Promo Code)
    let discountAmount = 0;
    if (promoCode) {
      const cleanCode = promoCode.trim().toUpperCase();
      if (cleanCode === "WELCOME2026" || cleanCode === "TESTVIP") {
        discountAmount = Math.round(subtotal * 0.1); // 10% discount
      } else if (cleanCode === "FREEPRO") {
        discountAmount = subtotal; // 100% demo
      }
    }

    const taxAmount = 0; // Tax standard 0% for test, configurable
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BILL${dateStr}-${randomSuffix}`;
    const paymentRef = `COMMERCE ${orderNumber}`;

    const bank = BILLING_CONFIG.DEFAULT_PAYMENT_BANK;
    const qrUrl = `https://img.vietqr.io/image/${bank.BANK_BIN}-${
      bank.ACCOUNT_NUMBER
    }-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
      paymentRef
    )}&accountName=${encodeURIComponent(bank.ACCOUNT_NAME)}`;

    const billingOrder: BillingOrder = {
      id: `order-bill-${Date.now()}`,
      order_number: orderNumber,
      actor_id: actorId,
      actor_type: actorType,
      actor_name: actorName,
      order_type: orderType,
      plan_code: planCode,
      billing_period: billingPeriod,
      items: orderItems,
      subtotal,
      discount_amount: discountAmount,
      promo_code: promoCode,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: "VND",
      payment_method: "VIETQR",
      payment_reference: paymentRef,
      qr_code_url: qrUrl,
      account_number: bank.ACCOUNT_NUMBER,
      account_name: bank.ACCOUNT_NAME,
      bank_name: bank.BANK_NAME,
      bank_bin: bank.BANK_BIN,
      status: totalAmount === 0 ? "PAID" : "PENDING",
      created_at: now.toISOString(),
      paid_at: totalAmount === 0 ? now.toISOString() : undefined,
    };

    return billingOrder;
  }

  /**
   * Process Webhook Confirmation & Activate/Extend Subscription
   */
  public static processPaymentWebhook(
    order: BillingOrder,
    currentSubscription: Subscription | null
  ): {
    updatedOrder: BillingOrder;
    updatedSubscription: Subscription;
    invoice: BillingInvoice;
  } {
    const now = new Date();
    const paidAt = now.toISOString();

    // 1. Mark Order as PAID
    const updatedOrder: BillingOrder = {
      ...order,
      status: "PAID",
      paid_at: paidAt,
    };

    // 2. Calculate Period End Date
    const periodMonths = order.billing_period === "ANNUAL" ? 12 : 1;
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + periodMonths);

    // 3. Build Subscription Items
    const newItems: SubscriptionItem[] = [];

    // Base Plan Item
    if (order.plan_code && order.plan_code !== "FREE") {
      const plan = BILLING_PLANS[order.plan_code];
      newItems.push({
        id: `sub-item-base-${Date.now()}`,
        subscription_id: currentSubscription?.id || `sub-${Date.now()}`,
        item_type: "BASE_PLAN",
        quantity: 1,
        unit_price: order.subtotal,
        total_amount: order.subtotal,
        effective_from: paidAt,
      });
    }

    // Add-on Items
    order.items
      .filter((i) => i.item_type === "ADDON")
      .forEach((item) => {
        const addon = BILLING_ADDONS.find((a) => a.id === item.reference_id);
        if (addon) {
          newItems.push({
            id: `sub-item-addon-${addon.code}-${Date.now()}`,
            subscription_id: currentSubscription?.id || `sub-${Date.now()}`,
            item_type: "ADDON",
            addon_id: addon.id,
            addon_code: addon.code,
            addon_name: addon.name,
            metric: addon.metric,
            increment_value: addon.increment_value,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.amount,
            effective_from: paidAt,
          });
        }
      });

    // Merge with existing subscription items if ADDON_PURCHASE
    let finalItems = newItems;
    if (
      order.order_type === "ADDON_PURCHASE" &&
      currentSubscription &&
      currentSubscription.items
    ) {
      finalItems = [...currentSubscription.items, ...newItems];
    }

    // 4. Update or Create Subscription
    const updatedSubscription: Subscription = {
      id: currentSubscription?.id || `sub-${Date.now()}`,
      actor_id: order.actor_id,
      actor_type: order.actor_type,
      actor_name: order.actor_name,
      plan_id: BILLING_PLANS[order.plan_code || "FREE"]?.id || "plan-free",
      plan_code: order.plan_code || "FREE",
      status: "ACTIVE",
      billing_period: order.billing_period || "MONTHLY",
      current_period_start: paidAt,
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: false,
      scheduled_downgrade_plan_id: null,
      items: finalItems,
      activated_at: currentSubscription?.activated_at || paidAt,
      updated_at: paidAt,
    };

    // 5. Generate Invoice
    const invoice: BillingInvoice = {
      id: `inv-${Date.now()}`,
      invoice_number: `INV-${order.order_number}`,
      billing_order_id: order.id,
      actor_id: order.actor_id,
      actor_name: order.actor_name,
      amount: order.total_amount,
      tax_amount: order.tax_amount,
      total_amount: order.total_amount,
      status: "PAID",
      issued_at: paidAt,
      description: `Thanh toán ${
        order.plan_code ? `Gói ${order.plan_code}` : "Dịch vụ mở rộng"
      } (${order.billing_period === "ANNUAL" ? "Hàng năm" : "Hàng tháng"})`,
    };

    return {
      updatedOrder,
      updatedSubscription,
      invoice,
    };
  }

  /**
   * Schedule Downgrade at period end (Never deletes user data)
   */
  public static scheduleDowngrade(
    subscription: Subscription,
    targetPlanCode: BillingPlanCode
  ): Subscription {
    return {
      ...subscription,
      cancel_at_period_end: true,
      scheduled_downgrade_plan_id: targetPlanCode,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Cancel Subscription at period end
   */
  public static cancelSubscription(subscription: Subscription): Subscription {
    return {
      ...subscription,
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Reactivate cancelled subscription
   */
  public static reactivateSubscription(subscription: Subscription): Subscription {
    return {
      ...subscription,
      cancel_at_period_end: false,
      scheduled_downgrade_plan_id: null,
      updated_at: new Date().toISOString(),
    };
  }
}
