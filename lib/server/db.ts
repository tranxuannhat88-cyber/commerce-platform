import fs from "fs";
import path from "path";
import {
  Offer,
  Store,
  Product,
  ActorPaymentAccount,
  Order,
  Organization,
  TemplateLicense,
  TransactionReview,
  ReviewReport,
  ActorReviewStats,
  ReviewResponse,
} from "@/types";
import { ReviewRevealService } from "@/lib/services/review-reveal-service";
import { TransactionReviewService } from "@/lib/services/transaction-review-service";

export interface ServerSellerProfile {
  actor_id?: string;
  actor_type?: "PERSONAL" | "ORGANIZATION";
  display_name?: string;
  full_name?: string;
  org_name?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
}

export interface ServerDatabase {
  stores: Store[];
  offers: Offer[];
  products: Product[];
  paymentAccounts: ActorPaymentAccount[];
  orders: Order[];
  organizations: Organization[];
  template_licenses: TemplateLicense[];
  sellerProfiles?: Record<string, ServerSellerProfile>;
  reviews: TransactionReview[];
  reviewReports: ReviewReport[];
  actorReviewStats?: Record<string, ActorReviewStats>;
  last_updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "server-db.json");

// In-memory cache for ultra-fast reading
let memoryDb: ServerDatabase | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
      console.error("Failed to create data directory:", err);
    }
  }
}

function getInitialDb(): ServerDatabase {
  return {
    stores: [],
    offers: [],
    products: [],
    paymentAccounts: [],
    orders: [],
    organizations: [],
    template_licenses: [],
    sellerProfiles: {},
    reviews: [],
    reviewReports: [],
    actorReviewStats: {},
    last_updated_at: new Date().toISOString(),
  };
}

export class ServerDbManager {
  /**
   * Đọc toàn bộ Database từ file / cache
   */
  public static getDb(): ServerDatabase {
    if (memoryDb) {
      return memoryDb;
    }

    ensureDataDir();

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw) as ServerDatabase;
        memoryDb = {
          stores: parsed.stores || [],
          offers: parsed.offers || [],
          products: parsed.products || [],
          paymentAccounts: parsed.paymentAccounts || [],
          orders: parsed.orders || [],
          organizations: parsed.organizations || [],
          template_licenses: parsed.template_licenses || [],
          sellerProfiles: parsed.sellerProfiles || {},
          reviews: parsed.reviews || [],
          reviewReports: parsed.reviewReports || [],
          actorReviewStats: parsed.actorReviewStats || {},
          last_updated_at: parsed.last_updated_at || new Date().toISOString(),
        };
        return memoryDb;
      } catch (err) {
        console.error("Error reading server-db.json, reinitializing:", err);
      }
    }

    memoryDb = getInitialDb();
    this.saveDb(memoryDb);
    return memoryDb;
  }

  /**
   * Lưu Database xuống file JSON an toàn
   */
  public static saveDb(db: ServerDatabase): void {
    ensureDataDir();
    db.last_updated_at = new Date().toISOString();
    memoryDb = db;

    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Error saving server-db.json:", err);
    }
  }

  // =========================================================================
  // STORE & SELLER PROFILE ACTIONS
  // =========================================================================
  public static getStoreBySlug(slug: string): Store | null {
    const db = this.getDb();
    const cleanSlug = slug.trim().toLowerCase();
    return db.stores.find((s) => s.slug?.toLowerCase() === cleanSlug || s.id === slug) || db.stores[0] || null;
  }

  public static getSellerProfile(storeIdOrActorId?: string): ServerSellerProfile | undefined {
    const db = this.getDb();
    if (!storeIdOrActorId) {
      const firstKey = Object.keys(db.sellerProfiles || {})[0];
      return firstKey ? db.sellerProfiles?.[firstKey] : undefined;
    }
    if (db.sellerProfiles?.[storeIdOrActorId]) {
      return db.sellerProfiles[storeIdOrActorId];
    }
    // Search by actor_id
    const found = Object.values(db.sellerProfiles || {}).find(
      (p) => p.actor_id === storeIdOrActorId
    );
    if (found) return found;
    const firstKey = Object.keys(db.sellerProfiles || {})[0];
    return firstKey ? db.sellerProfiles?.[firstKey] : undefined;
  }

  public static upsertStore(store: Store, sellerProfile?: ServerSellerProfile): Store {
    const db = this.getDb();
    const existingIndex = db.stores.findIndex((s) => s.id === store.id || s.slug === store.slug);

    if (existingIndex >= 0) {
      db.stores[existingIndex] = { ...db.stores[existingIndex], ...store, updated_at: new Date().toISOString() };
    } else {
      db.stores.push({ ...store, created_at: store.created_at || new Date().toISOString() });
    }

    if (!db.sellerProfiles) {
      db.sellerProfiles = {};
    }
    if (sellerProfile) {
      if (store.id) db.sellerProfiles[store.id] = sellerProfile;
      if (store.owner_actor_id) db.sellerProfiles[store.owner_actor_id] = sellerProfile;
      if (sellerProfile.actor_id) db.sellerProfiles[sellerProfile.actor_id] = sellerProfile;
    }

    this.saveDb(db);
    return store;
  }

  // =========================================================================
  // OFFER ACTIONS
  // =========================================================================
  public static getOfferBySlug(storeSlug: string, offerSlug: string): Offer | null {
    const db = this.getDb();
    const cleanOfferSlug = offerSlug.trim().toLowerCase();
    const cleanStoreSlug = storeSlug.trim().toLowerCase();

    // 1. Try finding by offer slug and store slug
    const offer = db.offers.find((o) => {
      const matchSlug = o.slug?.toLowerCase() === cleanOfferSlug || o.id === offerSlug;
      if (!matchSlug) return false;

      if (o.store_slug && o.store_slug.toLowerCase() === cleanStoreSlug) return true;
      const targetStore = db.stores.find((s) => s.id === o.store_id);
      if (targetStore && targetStore.slug?.toLowerCase() === cleanStoreSlug) return true;
      return true;
    });

    return offer || null;
  }

  public static getActiveOffersByStore(storeIdOrSlug: string): Offer[] {
    const db = this.getDb();
    const clean = storeIdOrSlug.trim().toLowerCase();
    const store = db.stores.find((s) => s.id === storeIdOrSlug || s.slug?.toLowerCase() === clean);

    return db.offers.filter((o) => {
      if (o.status !== "ACTIVE") return false;
      if (store && (o.store_id === store.id || o.store_slug?.toLowerCase() === store.slug?.toLowerCase())) return true;
      return o.store_slug?.toLowerCase() === clean || o.store_id === clean;
    });
  }

  public static upsertOffer(offer: Offer): Offer {
    const db = this.getDb();
    const existingIndex = db.offers.findIndex((o) => o.id === offer.id || o.slug === offer.slug);

    if (existingIndex >= 0) {
      db.offers[existingIndex] = { ...db.offers[existingIndex], ...offer, updated_at: new Date().toISOString() };
    } else {
      db.offers.push({ ...offer, created_at: offer.created_at || new Date().toISOString() });
    }

    this.saveDb(db);
    return offer;
  }

  public static deleteOffer(offerId: string): boolean {
    const db = this.getDb();
    const initialLen = db.offers.length;
    db.offers = db.offers.filter((o) => o.id !== offerId);
    if (db.offers.length !== initialLen) {
      this.saveDb(db);
      return true;
    }
    return false;
  }

  // =========================================================================
  // PAYMENT ACCOUNTS ACTIONS
  // =========================================================================
  public static getPaymentAccounts(actorId?: string): ActorPaymentAccount[] {
    const db = this.getDb();
    if (!actorId) return db.paymentAccounts;
    const matched = db.paymentAccounts.filter((a) => a.actor_id === actorId || a.is_default);
    if (matched.length > 0) return matched;
    return db.paymentAccounts;
  }

  public static upsertPaymentAccount(account: ActorPaymentAccount): ActorPaymentAccount {
    const db = this.getDb();
    const existingIndex = db.paymentAccounts.findIndex((a) => a.id === account.id || (a.account_number === account.account_number && a.bank_bin === account.bank_bin));

    if (account.is_default) {
      // Set all other accounts of this actor to non-default
      db.paymentAccounts = db.paymentAccounts.map((a) =>
        a.actor_id === account.actor_id ? { ...a, is_default: false } : a
      );
    }

    if (existingIndex >= 0) {
      db.paymentAccounts[existingIndex] = { ...db.paymentAccounts[existingIndex], ...account, updated_at: new Date().toISOString() };
    } else {
      db.paymentAccounts.push({ ...account, created_at: account.created_at || new Date().toISOString() });
    }

    this.saveDb(db);
    return account;
  }

  public static upsertPaymentAccounts(accounts: ActorPaymentAccount[]): void {
    const db = this.getDb();
    accounts.forEach((acc) => {
      const idx = db.paymentAccounts.findIndex((a) => a.id === acc.id || (a.account_number === acc.account_number && a.bank_bin === acc.bank_bin));
      if (idx >= 0) {
        db.paymentAccounts[idx] = { ...db.paymentAccounts[idx], ...acc, updated_at: new Date().toISOString() };
      } else {
        db.paymentAccounts.push({ ...acc, created_at: acc.created_at || new Date().toISOString() });
      }
    });
    this.saveDb(db);
  }

  public static deletePaymentAccount(accountId: string): boolean {
    const db = this.getDb();
    const initialLen = db.paymentAccounts.length;
    db.paymentAccounts = db.paymentAccounts.filter((a) => a.id !== accountId);
    if (db.paymentAccounts.length !== initialLen) {
      this.saveDb(db);
      return true;
    }
    return false;
  }

  // =========================================================================
  // ORDERS ACTIONS (CROSS-DEVICE BUYER -> SELLER)
  // =========================================================================
  public static getOrders(storeIdOrSlug?: string): Order[] {
    const db = this.getDb();
    if (!storeIdOrSlug) return db.orders;
    const clean = storeIdOrSlug.trim().toLowerCase();
    const store = db.stores.find((s) => s.id === storeIdOrSlug || s.slug?.toLowerCase() === clean);

    return db.orders.filter((o) => {
      if (store && o.store_id === store.id) return true;
      return o.store_id === storeIdOrSlug;
    });
  }

  public static createOrder(order: Order): Order {
    const db = this.getDb();
    const existingIndex = db.orders.findIndex((o) => o.id === order.id || o.order_number === order.order_number);

    if (existingIndex >= 0) {
      db.orders[existingIndex] = { ...db.orders[existingIndex], ...order, updated_at: new Date().toISOString() };
    } else {
      db.orders.unshift({ ...order, created_at: order.created_at || new Date().toISOString() });
    }

    this.saveDb(db);
    return order;
  }

  public static updateOrderStatus(orderId: string, status: Order["order_status"]): Order | null {
    const db = this.getDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.order_status = status;
    order.updated_at = new Date().toISOString();
    this.saveDb(db);
    return order;
  }

  // =========================================================================
  // TEMPLATE LICENSES ACTIONS
  // =========================================================================
  public static getTemplateLicenses(actorId?: string): TemplateLicense[] {
    const db = this.getDb();
    if (!db.template_licenses) db.template_licenses = [];
    if (!actorId) return db.template_licenses;
    return db.template_licenses.filter((l) => l.actor_id === actorId);
  }

  public static upsertTemplateLicense(license: TemplateLicense): TemplateLicense {
    const db = this.getDb();
    if (!db.template_licenses) db.template_licenses = [];

    const existingIdx = db.template_licenses.findIndex(
      (l) =>
        l.id === license.id ||
        (l.actor_id === license.actor_id &&
          (l.template_id === license.template_id || l.template_code === license.template_code))
    );

    if (existingIdx >= 0) {
      db.template_licenses[existingIdx] = {
        ...db.template_licenses[existingIdx],
        ...license,
      };
    } else {
      db.template_licenses.push(license);
    }

    this.saveDb(db);
    return license;
  }

  public static hasActiveLicense(actorId: string, templateIdOrCode: string): boolean {
    const licenses = this.getTemplateLicenses(actorId);
    const clean = templateIdOrCode.trim().toLowerCase();
    return licenses.some(
      (l) =>
        (l.template_id.toLowerCase() === clean || l.template_code.toLowerCase() === clean) &&
        l.status === "ACTIVE"
    );
  }

  // ==========================================
  // VERIFIED REVIEWS & REPUTATION ENGINE
  // ==========================================

  public static getAllReviews(): TransactionReview[] {
    const db = this.getDb();
    if (!db.reviews) db.reviews = [];
    
    // Process Double-Blind reveal whenever reviews are read
    const { updatedReviews, newlyPublishedCount } = ReviewRevealService.processDoubleBlindReveal(db.reviews);
    if (newlyPublishedCount > 0) {
      db.reviews = updatedReviews;
      this.saveDb(db);
    }
    return db.reviews;
  }

  public static getActorReviews(actorId: string, currentActorId?: string): TransactionReview[] {
    const all = this.getAllReviews();
    const forActor = all.filter((r) => r.reviewee_actor_id === actorId || r.reviewer_actor_id === actorId);
    return ReviewRevealService.sanitizeReviewsForActor(forActor, currentActorId);
  }

  public static getActorReviewStats(actorId: string, actorType: "PERSONAL" | "ORGANIZATION" = "PERSONAL"): ActorReviewStats {
    const all = this.getAllReviews();
    return TransactionReviewService.calculateActorStats(actorId, actorType, all);
  }

  public static upsertReview(review: TransactionReview): { review: TransactionReview; isRevealed: boolean } {
    const db = this.getDb();
    if (!db.reviews) db.reviews = [];

    const existingIdx = db.reviews.findIndex(
      (r) =>
        r.id === review.id ||
        (r.transaction_id === review.transaction_id &&
          r.reviewer_actor_id === review.reviewer_actor_id &&
          r.reviewee_actor_id === review.reviewee_actor_id)
    );

    if (existingIdx >= 0) {
      db.reviews[existingIdx] = {
        ...db.reviews[existingIdx],
        ...review,
        updated_at: new Date().toISOString(),
      };
    } else {
      db.reviews.unshift(review);
    }

    // Run Double-Blind reveal check
    const { updatedReviews } = ReviewRevealService.processDoubleBlindReveal(db.reviews);
    db.reviews = updatedReviews;
    this.saveDb(db);

    const saved = db.reviews.find((r) => r.id === review.id) || review;
    return {
      review: saved,
      isRevealed: saved.status === "PUBLISHED",
    };
  }

  public static respondToReview(reviewId: string, response: ReviewResponse): TransactionReview | null {
    const db = this.getDb();
    if (!db.reviews) db.reviews = [];

    const targetIdx = db.reviews.findIndex((r) => r.id === reviewId);
    if (targetIdx < 0) return null;

    db.reviews[targetIdx] = {
      ...db.reviews[targetIdx],
      response,
      updated_at: new Date().toISOString(),
    };

    this.saveDb(db);
    return db.reviews[targetIdx];
  }

  public static reportReview(report: ReviewReport): ReviewReport {
    const db = this.getDb();
    if (!db.reviewReports) db.reviewReports = [];

    db.reviewReports.unshift(report);
    this.saveDb(db);
    return report;
  }
}

