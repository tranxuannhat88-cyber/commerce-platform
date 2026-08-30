/**
 * COMMERCE & TRANSACTION PLATFORM - BILLING & SUBSCRIPTION DATA TYPES
 * Centralized, data-driven entities for Plans, Prices, Add-ons, Entitlements & Invoices.
 */

export type BillingPlanCode = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

export type BillingPeriod = "MONTHLY" | "ANNUAL";

export type BillingMode = "DISABLED" | "DISPLAY_ONLY" | "TEST_PAYMENT" | "LIVE_PAYMENT";

export type MetricType =
  | "TRANSACTIONS_MONTHLY"
  | "ACTIVE_PRODUCTS"
  | "STORAGE_BYTES"
  | "USERS"
  | "STORES";

export type AddonType = "CAPACITY_ADDON" | "USAGE_PACK";

export type AddonMetric =
  | "TRANSACTIONS"
  | "ACTIVE_PRODUCTS"
  | "STORAGE_GB"
  | "USERS"
  | "STORES"
  | "AI_TOKENS";

export interface BillingPlanPrice {
  billing_period: BillingPeriod;
  currency: "VND" | "USD";
  amount: number;
  original_amount?: number; // E.g., for Annual, 12 months full price
  savings_amount?: number;  // E.g., 2 months free savings
  monthly_equivalent?: number; // Amount / 12 for annual display
}

export interface BillingPlan {
  id: string;
  code: BillingPlanCode;
  name: string;
  tagline: string;
  description: string;
  display_order: number;
  is_public: boolean;
  is_featured: boolean;
  highlight_badge?: string;
  prices: Record<BillingPeriod, BillingPlanPrice>;
  limits: {
    transactions_monthly: number | null; // null = unlimited / custom
    active_products: number | null;
    storage_bytes: number | null; // in bytes
    storage_display: string;      // e.g. "500 MB", "15 GB"
    users: number | null;
    stores: number | null;
  };
  features: {
    offers_unlimited: boolean;
    requests_unlimited: boolean;
    quotations_unlimited: boolean;
    order_checkout_vietqr: boolean;
    shipping_calculator: boolean;
    inventory_management: "NONE" | "BASIC" | "ADVANCED";
    reporting: "NONE" | "BASIC" | "ADVANCED";
    roles_permissions: "NONE" | "BASIC" | "ADVANCED";
    multi_store: boolean;
    multi_workspace: boolean;
    api_access: "NONE" | "LIMITED" | "FULL" | "CUSTOM";
    transaction_verification: boolean;
    sla_support: "COMMUNITY" | "STANDARD" | "PRIORITY" | "DEDICATED_24_7";
    business_workflows: boolean;
  };
  feature_bullets: string[];
  cta_label: string;
}

export interface BillingAddon {
  id: string;
  code: string;
  name: string;
  type: AddonType;
  metric: AddonMetric;
  increment_value: number; // e.g. 500 (transactions), 10 (GB), 5 (users)
  display_value: string;   // e.g. "+500 Giao dịch", "+10 GB"
  price: number;           // VND
  billing_cycle: "RECURRING_MONTHLY" | "ONE_TIME";
  min_plan_required?: BillingPlanCode; // E.g. FREE cannot buy transaction add-on
  is_active: boolean;
  description?: string;
}

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "GRACE_PERIOD"
  | "CANCELLED"
  | "EXPIRED"
  | "SUSPENDED";

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  item_type: "BASE_PLAN" | "ADDON";
  addon_id?: string;
  addon_code?: string;
  addon_name?: string;
  metric?: AddonMetric;
  increment_value?: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  effective_from: string;
  effective_to?: string;
}

export interface Subscription {
  id: string;
  actor_id: string;          // e.g. "org-2k-tech" or "usr_..."
  actor_type: "PERSONAL" | "ORGANIZATION";
  actor_name: string;
  plan_id: string;
  plan_code: BillingPlanCode;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  scheduled_downgrade_plan_id?: string | null;
  items: SubscriptionItem[];
  activated_at: string;
  updated_at: string;
}

export type BillingOrderType =
  | "NEW_SUBSCRIPTION"
  | "RENEWAL"
  | "UPGRADE"
  | "ADDON_PURCHASE"
  | "PLAN_CHANGE";

export type BillingOrderStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";

export interface BillingOrderItem {
  id: string;
  billing_order_id: string;
  item_type: "PLAN" | "ADDON";
  reference_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface BillingOrder {
  id: string;
  order_number: string;
  actor_id: string;
  actor_type: "PERSONAL" | "ORGANIZATION";
  actor_name: string;
  subscription_id?: string;
  order_type: BillingOrderType;
  plan_code?: BillingPlanCode;
  billing_period?: BillingPeriod;
  items: BillingOrderItem[];
  subtotal: number;
  discount_amount: number;
  promo_code?: string;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method: "VIETQR" | "BANK_TRANSFER";
  payment_reference: string;
  qr_code_url?: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_bin: string;
  status: BillingOrderStatus;
  created_at: string;
  paid_at?: string;
}

export interface BillingInvoice {
  id: string;
  invoice_number: string;
  billing_order_id: string;
  actor_id: string;
  actor_name: string;
  tax_code?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: "ISSUED" | "PAID";
  issued_at: string;
  description: string;
}

export interface UsageMetrics {
  transactions_used: number;
  transactions_limit: number | null;
  products_used: number;
  products_limit: number | null;
  storage_bytes_used: number;
  storage_bytes_limit: number | null;
  users_used: number;
  users_limit: number | null;
  stores_used: number;
  stores_limit: number | null;
}

export interface SmartUpgradeRecommendation {
  should_upgrade: boolean;
  current_total_monthly: number;
  recommended_plan_code: BillingPlanCode;
  recommended_plan_monthly_price: number;
  monthly_savings: number;
  additional_benefits: string[];
}
