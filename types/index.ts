export type UserRole = 
  | 'OWNER' 
  | 'ADMIN' 
  | 'SALES' 
  | 'PURCHASING' 
  | 'WAREHOUSE' 
  | 'ACCOUNTING' 
  | 'MEMBER';

export type OrganizationType = 'HOUSEHOLD' | 'COMPANY' | 'OTHER';

export interface PersonalActor {
  id: string; // e.g. "actor_usr_xxx"
  user_id: string;
  display_name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkContext {
  actor_id: string;
  context_type: 'PERSONAL' | 'ORGANIZATION';
  organization_id?: string;
  display_name: string;
  role?: UserRole;
  org_type?: OrganizationType;
  plan_code?: import('@/lib/billing/types').BillingPlanCode;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  short_name?: string;
  slug: string;
  org_type?: OrganizationType;
  tax_code?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED';
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joined_at: string;
  created_at: string;
}

export interface Store {
  id: string;
  organization_id?: string; // Optional if owned by Personal
  owner_actor_id: string;   // Either PersonalActor ID or Organization ID
  owner_actor_type: 'PERSONAL' | 'ORGANIZATION';
  store_name: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website_url?: string;
  verification_status?: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED';
  social_links?: Record<string, string>;
  business_hours?: Record<string, string>;
  // Legacy / Quick settings
  payment_settings?: {
    bank_bin?: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
    enable_cod?: boolean;
    enable_bank_transfer?: boolean;
  };
  shipping_settings?: {
    shipping_enabled: boolean;
    default_fixed_fee?: number;
    free_shipping_threshold?: number;
    enable_store_pickup?: boolean;
    enable_quote_later?: boolean;
    pickup_address?: string;
    pickup_instructions?: string;
  };
  // Advanced Normalized Settings
  advanced_payment_settings?: StorePaymentSettings;
  advanced_fulfillment_settings?: StoreFulfillmentSettings;
  fulfillment_settings?: StoreFulfillmentSettings;
  product_visibility_settings?: {
    show_out_of_stock_products: boolean;
    show_low_stock_badge?: boolean;
    low_stock_threshold?: number;
  };
  public_settings?: StorePublicSettings;
  policy_settings?: StorePolicySettings;
  // Store Template & Presentation Settings
  active_template_id?: string;
  template_version?: string;
  customization?: StoreCustomizationSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OfferVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

// ==========================================
// ACTOR PAYMENT ACCOUNTS & STORE SETTINGS
// ==========================================

export interface ActorPaymentAccount {
  id: string;
  actor_id: string;
  actor_type: 'ORGANIZATION' | 'PERSONAL';
  bank_bin: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
  qr_image_url?: string;
  qr_template?: 'compact' | 'qr_only' | 'print';
  is_default: boolean;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export type PaymentMethodType =
  | 'VIETQR'
  | 'BANK_TRANSFER'
  | 'COD'
  | 'PAY_AT_STORE'
  | 'DEPOSIT'
  | 'PAY_LATER'
  | 'ONLINE_GATEWAY'
  | 'OTHER';

export interface StorePaymentMethodConfig {
  id: string;
  method_type: PaymentMethodType;
  name: string;
  is_enabled: boolean;
  display_order: number;
  deposit_percentage?: number;
  deposit_fixed_amount?: number;
  pay_later_terms?: 'NET_7' | 'NET_15' | 'NET_30' | 'NET_45' | 'CUSTOM';
  pay_later_days?: number;
  custom_instructions?: string;
}

export interface StorePaymentSettings {
  store_id: string;
  default_payment_account_id?: string;
  enabled_methods: PaymentMethodType[];
  method_configs: Record<PaymentMethodType, Partial<StorePaymentMethodConfig>>;
  allow_offer_override: boolean;
}

export type FulfillmentMethodType =
  | 'DELIVERY'
  | 'SELLER_DELIVERY'
  | 'EXPRESS_DELIVERY'
  | 'STORE_PICKUP'
  | 'CARRIER'
  | 'SHIPPING_QUOTE_LATER'
  | 'NO_DELIVERY'
  | 'ON_SITE_SERVICE'
  | 'DIGITAL';

export type ShippingFeeRuleType =
  | 'FREE'
  | 'FIXED'
  | 'ZONE'
  | 'FREE_THRESHOLD'
  | 'QUOTE_LATER'
  | 'WEIGHT'
  | 'DISTANCE'
  | 'CARRIER_CALCULATED';

export interface StoreFulfillmentSettings {
  store_id: string;
  enabled_methods: FulfillmentMethodType[];
  default_method: FulfillmentMethodType;
  fee_rule_type: ShippingFeeRuleType;
  fixed_fee: number;
  free_shipping_threshold?: number;
  free_distance_km?: number;
  enable_fixed_fee?: boolean;
  enable_free_threshold?: boolean;
  enable_free_distance?: boolean;
  enable_pickup?: boolean;
  enable_quote_later?: boolean;
  pickup_config?: {
    store_name: string;
    address: string;
    business_hours?: string;
    instructions?: string;
  };
  zones: ShippingZone[];
}

export interface OfferPaymentOverride {
  mode: 'STORE_DEFAULT' | 'OFFER_OVERRIDE';
  enabled_methods?: PaymentMethodType[];
  custom_payment_account_id?: string;
  deposit_type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  deposit_percentage?: number;
  deposit_fixed_amount?: number;
  pay_later_terms?: 'NET_7' | 'NET_15' | 'NET_30' | 'NET_45' | 'CUSTOM';
  pay_later_days?: number;
  pay_later_due_date_basis?: 'ORDER_CONFIRMATION' | 'DELIVERY' | 'INVOICE_DATE';
}

export interface OfferFulfillmentOverride {
  mode: 'STORE_DEFAULT' | 'OFFER_OVERRIDE';
  enabled_methods?: FulfillmentMethodType[];
  default_method?: FulfillmentMethodType;
  fee_rule_type?: ShippingFeeRuleType;
  fixed_fee?: number;
  free_shipping_threshold?: number;
  free_distance_km?: number;
  enable_fixed_fee?: boolean;
  enable_free_threshold?: boolean;
  enable_free_distance?: boolean;
  enable_pickup?: boolean;
  enable_quote_later?: boolean;
  zone_overrides?: Array<{ zone_id: string; fee: number }>;
  pickup_instructions_override?: string;
}

export interface StorePublicSettings {
  show_logo: boolean;
  show_description: boolean;
  show_region: boolean;
  show_full_address: boolean;
  show_business_phone: boolean;
  public_contact_phone?: string;
  show_business_email: boolean;
  public_business_email?: string;
  show_website: boolean;
  website_url?: string;
  show_products: boolean;
  show_services: boolean;
  show_active_offers: boolean;
  show_policies: boolean;
  show_reputation: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StorePolicySettings {
  shipping_policy?: string;
  return_policy?: string;
  warranty_policy?: string;
  payment_terms?: string;
  processing_time?: string;
  service_area?: string;
}

export interface SellerReputationMetrics {
  actor_id: string;
  rating_average?: number | null;
  rating_count?: number;
  trust_score?: number | null;
  completed_transactions: number;
  completion_rate?: number | null;
  on_time_delivery_rate?: number | null;
  response_rate?: number;
  dispute_rate?: number;
  verified_transaction_count?: number;
  platform_member_since?: string;
  is_verified_business?: boolean;
  is_phone_verified?: boolean;
}

export interface SellerPublicProfileDTO {
  actor_id: string;
  actor_type: 'PERSONAL' | 'ORGANIZATION';
  display_name: string;
  legal_name?: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  region?: string;
  full_address?: string;
  public_contact_phone?: string;
  public_business_email?: string;
  website_url?: string;
  reputation: SellerReputationMetrics;
  public_stores: Array<{
    id: string;
    store_name: string;
    slug: string;
    logo_url?: string;
    product_count: number;
  }>;
  active_offers: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number;
    image_url?: string;
    store_slug: string;
  }>;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'DISCONTINUED' | 'HIDDEN' | 'ARCHIVED';
export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNLIMITED' | 'NOT_APPLICABLE';
export type OutOfStockVisibility = 'HIDE' | 'SHOW_DISABLED';

export interface StoreProductVisibilitySettings {
  show_out_of_stock_products: boolean;
  show_low_stock_badge?: boolean;
  low_stock_threshold?: number;
}

export interface OfferVisibilitySettings {
  out_of_stock_visibility?: OutOfStockVisibility;
}

export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export interface BusinessParty {
  id: string;
  organization_id: string;
  type: PartyType;
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  tax_code?: string;
  addresses?: Array<{
    id: string;
    label: string;
    full_address: string;
    is_default?: boolean;
  }>;
  total_orders: number;
  total_spent: number;
  total_quotations: number;
  last_interacted_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type OfferType = 
  | 'PRODUCT' 
  | 'SERVICE' 
  | 'DIGITAL_PRODUCT' 
  | 'PACKAGE' 
  | 'SUBSCRIPTION' 
  | 'RENTAL' 
  | 'BOOKING' 
  | 'CUSTOM_QUOTATION';

export type OfferStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface Collection {
  id: string;
  organization_id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  store_id?: string;
  name: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  unit?: string;
  category?: string;
  description?: string;
  image_url?: string;
  gallery?: string[];
  attachments?: OfferAttachment[];
  variants?: OfferVariant[];
  product_status?: ProductStatus;
  inventory_tracking?: boolean;
  availability_status?: AvailabilityStatus;
  low_stock_threshold?: number;
  available_quantity?: number;
  on_hand_quantity?: number;
  reserved_quantity?: number;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferVariant {
  id: string;
  offer_id?: string;
  sku?: string;
  name: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  barcode?: string;
  weight?: number;
  attributes?: Record<string, string>;
  created_at: string;
}

export type OfferStructure = 'SINGLE' | 'MULTI_ITEMS' | 'MENU_CATALOG';

export interface OfferItem {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  unit?: string;
  description?: string;
  image_url?: string;
  gallery?: string[];
  attachments?: OfferAttachment[];
  variants?: OfferVariant[];
  category?: string;
  product_status?: ProductStatus;
  availability_status?: AvailabilityStatus;
  available_quantity?: number;
  inventory_tracking?: boolean;
  is_available?: boolean;
}

export interface OfferAttachment {
  id: string;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: string;
}

export interface Offer {
  id: string;
  organization_id: string;
  store_id: string;
  store_slug?: string;
  offer_type: OfferType;
  offer_structure?: OfferStructure;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  status: OfferStatus;
  visibility?: OfferVisibility;
  expires_at?: string;
  product_status?: ProductStatus;
  availability_status?: AvailabilityStatus;
  low_stock_threshold?: number;
  available_quantity?: number;
  out_of_stock_visibility?: OutOfStockVisibility;
  category_id?: string;
  collection_id?: string;
  image_url?: string;
  gallery?: string[];
  attachments?: OfferAttachment[];
  inventory_tracking: boolean;
  attributes?: Record<string, unknown>;
  service_duration_minutes?: number;
  service_unit?: string;
  variants?: OfferVariant[];
  items?: OfferItem[];
  payment_settings?: {
    bank_bin?: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
    enable_cod?: boolean;
    enable_bank_transfer?: boolean;
  };
  payment_override?: OfferPaymentOverride;
  fulfillment_override?: OfferFulfillmentOverride;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type RequestType = 
  | 'PRODUCT_REQUEST' 
  | 'SERVICE_REQUEST' 
  | 'RFQ' 
  | 'CUSTOM_MANUFACTURING' 
  | 'REPAIR_REQUEST' 
  | 'PROCUREMENT_REQUEST';

export type RequestStatus = 
  | 'DRAFT' 
  | 'OPEN' 
  | 'QUOTING' 
  | 'SELECTED' 
  | 'CLOSED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type RequestVisibility = 'PUBLIC_LINK' | 'PRIVATE_INVITE';

export interface RequestItem {
  id: string;
  request_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  specification?: string;
  target_price?: number;
  attributes?: Record<string, unknown>;
  created_at: string;
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

export interface RequestRFQ {
  id: string;
  request_number: string;
  buyer_user_id?: string;
  buyer_organization_id?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
  request_type: RequestType;
  visibility: RequestVisibility;
  title: string;
  slug: string;
  description: string;
  target_budget?: number;
  delivery_location?: string;
  required_date?: string;
  quotation_deadline?: string;
  status: RequestStatus;
  allow_partial_quote?: boolean;
  items?: RequestItem[];
  attachments?: RequestAttachment[];
  quotations_count?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type QuotationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'VIEWED' 
  | 'NEGOTIATING' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'WITHDRAWN';

export interface QuotationItem {
  id: string;
  quotation_id: string;
  request_item_id?: string;
  item_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  note?: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  request_id: string;
  request_title?: string;
  buyer_organization_id?: string;
  buyer_user_id?: string;
  seller_organization_id?: string;
  seller_user_id?: string;
  guest_seller_name?: string;
  guest_company_name?: string;
  guest_phone?: string;
  guest_email?: string;
  guest_claim_token?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_fee: number;
  total: number;
  lead_time?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty?: string;
  valid_until?: string;
  note?: string;
  status: QuotationStatus;
  version: number;
  items?: QuotationItem[];
  submitted_at: string;
  viewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationVersion {
  id: string;
  quotation_id: string;
  version_number: number;
  payload_snapshot: Record<string, unknown>;
  document_hashes: string[];
  canonical_hash: string;
  created_at: string;
  submitted_at: string;
}

export type OrderSource = 'SOURCE_OFFER' | 'SOURCE_QUOTATION';
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  order_id: string;
  offer_id?: string;
  variant_id?: string;
  offer_type: string;
  item_name: string;
  variant_name?: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  total_price: number;
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  organization_id: string;
  store_id?: string;
  order_number: string;
  source_type: OrderSource;
  source_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address?: {
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    full_address: string;
    latitude?: number;
    longitude?: number;
    map_url?: string;
  };
  has_physical_items: boolean;
  order_status: OrderStatus;
  payment_status?: PaymentStatus;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount?: number;
  platform_fee?: number;
  other_fee?: number;
  total_amount: number;
  shipping_status?: ShippingStatus;
  shipping_snapshot?: OrderShippingSnapshot;
  payment_snapshot?: OrderPaymentSnapshot;
  fulfillment_snapshot?: OrderFulfillmentSnapshot;
  customer_notes?: string;
  internal_notes?: string;
  items?: OrderItem[];
  payment?: Payment;
  created_at: string;
  updated_at: string;
}

// ==========================================
// SHIPPING & FULFILLMENT DOMAIN TYPES
// ==========================================

export type ShippingMethodType = 
  | 'FREE' 
  | 'FIXED' 
  | 'FREE_THRESHOLD' 
  | 'ZONE' 
  | 'DISTANCE' 
  | 'WEIGHT' 
  | 'CARRIER' 
  | 'PICKUP' 
  | 'QUOTE_LATER';

export type ShippingStatus = 
  | 'NOT_REQUIRED' 
  | 'WAITING' 
  | 'QUOTING' 
  | 'QUOTED' 
  | 'READY' 
  | 'PICKUP_PENDING' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'FAILED' 
  | 'CANCELLED';

export type FulfillmentType = 
  | 'SHIPPING' 
  | 'PICKUP' 
  | 'DIGITAL' 
  | 'ON_SITE_SERVICE' 
  | 'NO_DELIVERY';

export interface ShippingMethod {
  id: string;
  organization_id: string;
  store_id: string;
  name: string;
  method_type: ShippingMethodType;
  fixed_fee?: number;
  free_shipping_threshold?: number;
  min_order_value?: number;
  max_order_value?: number;
  estimated_days?: string;
  description?: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingZone {
  id: string;
  organization_id: string;
  store_id: string;
  name: string;
  provinces: string[];
  shipping_fee: number;
  free_shipping_threshold?: number;
  estimated_days?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderShippingSnapshot {
  shipping_method_id?: string;
  method_name: string;
  method_type: ShippingMethodType;
  fulfillment_type: FulfillmentType;
  shipping_fee: number;
  shipping_fee_original: number;
  shipping_discount: number;
  carrier_cost?: number;
  shipping_status: ShippingStatus;
  estimated_delivery?: string;
  quote_notes?: string;
  quoted_at?: string;
  quoted_by?: string;
}

export interface OrderPaymentSnapshot {
  method_type: PaymentMethodType;
  method_name: string;
  payment_status: PaymentStatus;
  terms?: string;
  deposit_type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  deposit_amount?: number;
  remaining_amount?: number;
  payment_due_date?: string;
  due_date_basis?: string;
  bank_account_snapshot?: {
    bank_bin: string;
    bank_name: string;
    bank_short_name: string;
    account_number: string;
    account_name: string;
  };
  custom_instructions?: string;
}

export interface OrderFulfillmentSnapshot {
  method_type: FulfillmentMethodType;
  method_name: string;
  fee_rule_type: ShippingFeeRuleType;
  base_shipping_fee: number;
  shipping_discount: number;
  final_shipping_fee: number;
  pickup_location?: string;
  pickup_instructions?: string;
  zone_name?: string;
  estimated_delivery?: string;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'COD' | 'CASH' | 'MOMO' | 'VNPAY' | 'OTHER';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'COD_PENDING' | 'REFUNDED';

export interface Payment {
  id: string;
  organization_id: string;
  order_id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount: number;
  currency: string;
  provider: string;
  provider_reference?: string;
  qr_code_url?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  gateway_transaction_id: string;
  raw_payload: Record<string, unknown>;
  amount_received: number;
  verified: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address?: string;
  is_default: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  offer_id: string;
  offer_name?: string;
  variant_id?: string;
  variant_name?: string;
  warehouse_id: string;
  on_hand: number;
  reserved: number;
  available: number;
  minimum_stock: number;
  updated_at: string;
}

export type MovementType = 'OPENING' | 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGED' | 'ADJUSTMENT' | 'STOCKTAKE';

export interface InventoryMovement {
  id: string;
  organization_id: string;
  inventory_item_id: string;
  offer_name?: string;
  movement_type: MovementType;
  quantity: number;
  before_qty: number;
  after_qty: number;
  reference_type?: string;
  reference_id?: string;
  note?: string;
  created_by?: string;
  created_at: string;
}

export type LedgerEntryType = 'ORDER_CREATED' | 'PAYMENT_RECEIVED' | 'REFUND' | 'EXPENSE_LOGGED' | 'DELIVERY_FEE' | 'PLATFORM_FEE';
export type LedgerDirection = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  organization_id: string;
  entry_type: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  reference_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

export type ExpenseCategory = 'DELIVERY' | 'MARKETING' | 'RENT' | 'UTILITIES' | 'LABOR' | 'MATERIALS' | 'OTHER';

export interface Expense {
  id: string;
  organization_id: string;
  category: ExpenseCategory;
  amount: number;
  paid_at: string;
  description: string;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  organization_id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ==========================================
// BLOCKCHAIN VERIFICATION & TRUST LAYER TYPES
// ==========================================

export type VerificationStatus = 'PENDING' | 'BATCHED' | 'ANCHORED' | 'VERIFIED' | 'FAILED';
export type MerkleBatchStatus = 'BUILDING' | 'READY' | 'ANCHORING' | 'ANCHORED' | 'FAILED';
export type AnchorStatus = 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';

export interface DocumentHash {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_version: number;
  file_hash: string;
  file_size: number;
  mime_type?: string;
  storage_path: string;
  uploaded_at: string;
}

export interface VerificationRecord {
  id: string;
  organization_id: string;
  transaction_id?: string;
  entity_type: string; // 'request' | 'quotation' | 'order' | 'payment' | 'delivery'
  entity_id: string;
  entity_version: number;
  event_id: string;
  event_type: string; // 'REQUEST_PUBLISHED' | 'QUOTATION_SUBMITTED' | 'QUOTATION_ACCEPTED' | 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'TRANSACTION_COMPLETED'
  canonical_payload_hash: string;
  hash_algorithm: string;
  merkle_batch_id?: string;
  merkle_leaf_index?: number;
  verification_status: VerificationStatus;
  blockchain_anchor_id?: string;
  created_at: string;
}

export interface MerkleBatch {
  id: string;
  batch_number: number;
  record_count: number;
  merkle_root: string;
  status: MerkleBatchStatus;
  created_at: string;
  anchored_at?: string;
  blockchain_anchor_id?: string;
}

export interface BlockchainAnchor {
  id: string;
  provider: string;
  network: string;
  chain_id: number;
  batch_id: string;
  merkle_root: string;
  transaction_hash?: string;
  block_number?: number;
  contract_address?: string;
  status: AnchorStatus;
  retry_count: number;
  error_message?: string;
  submitted_at?: string;
  confirmed_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  transaction_code: string; // TX260829-005821
  order_id?: string;
  order_number?: string;
  request_id?: string;
  request_number?: string;
  quotation_id?: string;
  quotation_number?: string;
  quotation_version: number;
  buyer_party_id?: string;
  buyer_name?: string;
  seller_party_id?: string;
  seller_name?: string;
  total_amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  verification_completeness_score: number; // 0 - 100%
  is_fully_verified: boolean;
  verification_records?: VerificationRecord[];
  created_at: string;
  completed_at?: string;
}

// =========================================================================
// MEDIA & FILE STORAGE ARCHITECTURE TYPES
// =========================================================================
export type MediaOwnerType =
  | 'STORE'
  | 'OFFER'
  | 'OFFER_ITEM'
  | 'REQUEST'
  | 'QUOTATION'
  | 'ORDER'
  | 'TRANSACTION'
  | 'USER_PROFILE'
  | 'ORGANIZATION'
  | 'PERSONAL'
  | 'DELIVERY'
  | 'INVOICE'
  | 'CONTRACT'
  | 'OTHER';

export type MediaVisibility =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'AUTHORIZED_VIEWER'
  | 'TRANSACTION_EVIDENCE';

export type MediaAssetStatus =
  | 'UPLOADING'
  | 'PROCESSING'
  | 'ACTIVE'
  | 'QUARANTINED'
  | 'SOFT_DELETED'
  | 'ARCHIVED'
  | 'PURGED'
  | 'FAILED'
  | 'TEMP';

export type StorageProviderType =
  | 'CLOUDFLARE_R2'
  | 'AWS_S3'
  | 'GOOGLE_CLOUD_STORAGE'
  | 'SUPABASE_STORAGE'
  | 'LOCAL_MOCK';

export interface MediaAsset {
  id: string;
  organization_id?: string;
  owner_type: MediaOwnerType;
  owner_id?: string;
  storage_provider: StorageProviderType;
  bucket: string;
  object_key: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  file_extension: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  visibility: MediaVisibility;
  status: MediaAssetStatus;
  sha256_hash?: string;
  hash_algorithm?: string;
  hashed_at?: string;
  uploaded_by_user_id?: string;
  uploaded_by_guest_identity_id?: string;
  upload_intent_token?: string;
  retention_until?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaVariant {
  id: string;
  media_asset_id: string;
  variant_type: 'thumbnail_320' | 'medium_800' | 'large_1600' | 'square_400' | 'social_og';
  width: number;
  height: number;
  mime_type: string;
  bucket: string;
  object_key: string;
  file_size: number;
  created_at: string;
}

export interface OrganizationStorageUsage {
  organization_id: string;
  plan_tier: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  quota_bytes: number;
  total_bytes: number;
  public_media_bytes: number;
  private_document_bytes: number;
  transaction_evidence_bytes: number;
  asset_count: number;
  updated_at: string;
}

export interface MediaAccessAuditLog {
  id: string;
  media_asset_id: string;
  user_id?: string;
  guest_identity_id?: string;
  action: 'FILE_VIEWED' | 'SIGNED_URL_CREATED' | 'FILE_DOWNLOADED' | 'EVIDENCE_VERIFIED' | 'FILE_DELETED';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// =========================================================================
// STORE TEMPLATES & TEMPLATE MARKETPLACE (MẪU GIAO DIỆN CỬA HÀNG)
// =========================================================================

export type TemplatePricingType = 'FREE' | 'PAID';
export type TemplateStatus = 'ACTIVE' | 'DRAFT' | 'HIDDEN' | 'DEPRECATED';
export type TemplateCategory = 'RETAIL' | 'SERVICE' | 'CORPORATE' | 'SHOWCASE' | 'LOCAL' | 'FLAGSHIP';

export interface StoreTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  pricing_type: TemplatePricingType;
  price: number; // 0 for FREE, 200000 for PAID
  currency: 'VND';
  status: TemplateStatus;
  version: string;
  category: TemplateCategory;
  badge_text?: string;
  preview_thumbnail_desktop: string;
  preview_thumbnail_mobile: string;
  features: string[];
  design_tokens: {
    font_family: string;
    border_radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    container_width: 'compact' | 'standard' | 'wide' | 'fluid';
    hero_layout: 'centered' | 'split' | 'banner' | 'minimal' | 'storytelling';
    product_card_style: 'minimal' | 'bordered' | 'elevated' | 'compact' | 'editorial';
    header_style: 'standard' | 'centered' | 'transparent' | 'stacked' | 'sidebar';
    color_palette_default: {
      primary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
    };
  };
  default_sections: string[];
}

export interface TemplateLicense {
  id: string;
  actor_id: string;
  actor_type: 'PERSONAL' | 'ORGANIZATION';
  template_id: string;
  template_code: string;
  purchase_order_id?: string;
  status: 'ACTIVE' | 'REFUNDED' | 'REVOKED';
  purchased_at: string;
  price_snapshot: number;
  currency_snapshot: 'VND';
}

export interface StoreCustomizationSettings {
  brand_color?: string;
  accent_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_banner_url?: string;
  visible_sections?: {
    hero?: boolean;
    trust_bar?: boolean;
    categories?: boolean;
    featured_offers?: boolean;
    products?: boolean;
    services?: boolean;
    about?: boolean;
    reviews?: boolean;
    policies?: boolean;
    contact?: boolean;
  };
}

