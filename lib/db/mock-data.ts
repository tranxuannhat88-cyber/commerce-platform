import { 
  Organization, 
  OrganizationMember,
  PersonalActor,
  Store, 
  Product,
  BusinessParty, 
  Category, 
  Collection, 
  Offer, 
  RequestRFQ, 
  Quotation, 
  QuotationVersion,
  DocumentHash,
  VerificationRecord,
  MerkleBatch,
  BlockchainAnchor,
  Transaction,
  Order, 
  Payment, 
  Warehouse, 
  InventoryItem, 
  InventoryMovement, 
  LedgerEntry, 
  Expense, 
  AppNotification,
  ShippingMethod,
  ShippingZone,
  ActorPaymentAccount,
  TemplateLicense,
} from "@/types";
import { UserIdentity, PasskeyCredential, AuthSession } from "@/lib/auth/types";
import { Subscription, BillingOrder, BillingInvoice } from "@/lib/billing/types";

// =========================================================================
// CLEAN INTERNAL TEST STATE — PURGE ALL MOCK / DEMO DATA
// Target: go.invamax.com
// All business records start empty ([] or clean baseline).
// System definitions remain intact.
// =========================================================================

export const IS_CLEAN_INTERNAL_TEST_STATE = true;

// 1. Payment Accounts (Empty initial state)
export const INITIAL_PAYMENT_ACCOUNTS: ActorPaymentAccount[] = [];

// 2. Personal Actor (Clean baseline before registration)
export const INITIAL_PERSONAL_ACTOR: PersonalActor = {
  id: "actor_empty",
  user_id: "",
  display_name: "",
  phone: "",
  email: "",
  avatar_url: "",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 3. Organizations (Empty initial list)
export const INITIAL_ORGANIZATION: Organization = {
  id: "",
  name: "",
  slug: "",
  org_type: "COMPANY",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_ORGANIZATIONS: Organization[] = [];
export const INITIAL_ORGANIZATION_MEMBERS: OrganizationMember[] = [];

// 4. Store (Empty initial store)
export const INITIAL_STORE: Store = {
  id: "",
  organization_id: "",
  owner_actor_id: "",
  owner_actor_type: "PERSONAL",
  store_name: "",
  slug: "",
  logo_url: "",
  cover_image_url: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  business_hours: {},
  social_links: {},
  is_active: true,
  payment_settings: {
    enable_cod: true,
    enable_bank_transfer: true,
  },
  shipping_settings: {
    shipping_enabled: true,
    default_fixed_fee: 30000,
    free_shipping_threshold: 500000,
    enable_store_pickup: true,
    enable_quote_later: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// 5. Catalog, Offers, Products, Warehouse, Inventory (Empty)
export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_COLLECTIONS: Collection[] = [];
export const INITIAL_OFFERS: Offer[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_WAREHOUSES: Warehouse[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_MOVEMENTS: InventoryMovement[] = [];

// 6. Commerce & RFQ Transactions (Empty)
export const INITIAL_REQUESTS: RequestRFQ[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_QUOTATION_VERSIONS: QuotationVersion[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PARTIES: BusinessParty[] = [];
export const INITIAL_LEDGER: LedgerEntry[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// 7. Trust & Merkle Verification Entities (Empty)
export const INITIAL_DOCUMENT_HASHES: DocumentHash[] = [];
export const INITIAL_VERIFICATION_RECORDS: VerificationRecord[] = [];
export const INITIAL_MERKLE_BATCHES: MerkleBatch[] = [];
export const INITIAL_BLOCKCHAIN_ANCHORS: BlockchainAnchor[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// 8. Shipping & Logistics (Empty)
export const INITIAL_SHIPPING_METHODS: ShippingMethod[] = [];
export const INITIAL_SHIPPING_ZONES: ShippingZone[] = [];

// 9. Auth & Identity (Empty)
export const INITIAL_USER_IDENTITY: UserIdentity | null = null;
export const INITIAL_PASSKEYS: PasskeyCredential[] = [];
export const INITIAL_AUTH_SESSION: AuthSession | null = null;

// 10. Subscriptions & Billing Instances (Clean FREE baseline)
export const INITIAL_SUBSCRIPTION_PERSONAL: Subscription = {
  id: "sub_initial_free",
  actor_id: "actor_empty",
  actor_type: "PERSONAL",
  actor_name: "Cá nhân",
  plan_id: "plan-free",
  plan_code: "FREE",
  status: "ACTIVE",
  billing_period: "MONTHLY",
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
  cancel_at_period_end: false,
  items: [
    {
      id: "item_initial_free_base",
      subscription_id: "sub_initial_free",
      item_type: "BASE_PLAN",
      quantity: 1,
      unit_price: 0,
      total_amount: 0,
      effective_from: new Date().toISOString(),
    },
  ],
  activated_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_SUBSCRIPTION: Subscription = INITIAL_SUBSCRIPTION_PERSONAL;
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];
export const INITIAL_BILLING_ORDERS: BillingOrder[] = [];
export const INITIAL_BILLING_INVOICES: BillingInvoice[] = [];

// 11. Template Licenses (Empty initial state)
export const INITIAL_TEMPLATE_LICENSES: TemplateLicense[] = [];
