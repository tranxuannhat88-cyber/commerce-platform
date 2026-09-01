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
  GuestIdentity,
  ReviewInvitation,
} from "@/types";
import { ReviewRevealService } from "@/lib/services/review-reveal-service";
import { TransactionReviewService } from "@/lib/services/transaction-review-service";
import { GuestClaimService } from "@/lib/services/guest-claim-service";
import { cleanPhoneNumber, slugify } from "@/lib/utils";

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
  guestIdentities?: GuestIdentity[];
  reviewInvitations?: ReviewInvitation[];
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
    stores: [
      {
        id: "store_invamax_workspace",
        organization_id: "org_invamax",
        owner_actor_id: "usr_owner",
        owner_actor_type: "ORGANIZATION",
        store_name: "INVAMAX workspace",
        slug: "invamax-workspace",
        logo_url: "",
        cover_image_url: "",
        description: "",
        phone: "",
        email: "",
        address: "",
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
      },
    ],
    offers: [],
    products: [],
    paymentAccounts: [],
    orders: [],
    organizations: [
      {
        id: "org_invamax",
        name: "INVAMAX workspace",
        slug: "invamax-workspace",
        org_type: "COMPANY",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    template_licenses: [],
    sellerProfiles: {},
    reviews: [],
    reviewReports: [],
    actorReviewStats: {},
    guestIdentities: [],
    reviewInvitations: [],
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
        const initial = getInitialDb();
        memoryDb = {
          stores: (parsed.stores && parsed.stores.length > 0) ? parsed.stores : initial.stores,
          offers: parsed.offers || [],
          products: parsed.products || [],
          paymentAccounts: parsed.paymentAccounts || [],
          orders: parsed.orders || [],
          organizations: (parsed.organizations && parsed.organizations.length > 0) ? parsed.organizations : initial.organizations,
          template_licenses: parsed.template_licenses || [],
          sellerProfiles: parsed.sellerProfiles || {},
          reviews: parsed.reviews || [],
          reviewReports: parsed.reviewReports || [],
          actorReviewStats: parsed.actorReviewStats || {},
          guestIdentities: parsed.guestIdentities || [],
          reviewInvitations: parsed.reviewInvitations || [],
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
    if (!slug) return db.stores[0] || null;
    const cleanSlug = slug.trim().toLowerCase();
    const slugified = slugify(slug);

    const found = db.stores.find((s) => {
      if (!s) return false;
      const sSlug = (s.slug || "").trim().toLowerCase();
      const sNameSlug = slugify(s.store_name || "");
      const sId = (s.id || "").trim().toLowerCase();

      return (
        sSlug === cleanSlug ||
        sId === cleanSlug ||
        sNameSlug === slugified ||
        sNameSlug === cleanSlug ||
        slugify(sSlug) === slugified ||
        (s.organization_id && s.organization_id.toLowerCase() === cleanSlug) ||
        (s.owner_actor_id && s.owner_actor_id.toLowerCase() === cleanSlug)
      );
    });

    if (found) return found;

    // If requested is "invamax-workspace" or "auto" and we have a store in db
    if ((cleanSlug === "invamax-workspace" || cleanSlug === "auto") && db.stores.length > 0) {
      return db.stores[0];
    }

    return null;
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
    const cleanSlug = (store.slug && store.slug !== "auto") 
      ? store.slug.trim().toLowerCase() 
      : (store.store_name ? slugify(store.store_name) : "invamax-workspace");

    const canonicalStore: Store = {
      ...store,
      slug: cleanSlug,
      updated_at: new Date().toISOString(),
    };

    const existingIndex = db.stores.findIndex((s) => 
      (store.id && s.id === store.id) || 
      (s.slug && s.slug.toLowerCase() === cleanSlug) ||
      (store.organization_id && s.organization_id === store.organization_id)
    );

    if (existingIndex >= 0) {
      db.stores[existingIndex] = { ...db.stores[existingIndex], ...canonicalStore };
    } else {
      db.stores.push({ ...canonicalStore, created_at: store.created_at || new Date().toISOString() });
    }

    if (!db.sellerProfiles) {
      db.sellerProfiles = {};
    }
    if (sellerProfile) {
      if (canonicalStore.id) db.sellerProfiles[canonicalStore.id] = sellerProfile;
      if (canonicalStore.owner_actor_id) db.sellerProfiles[canonicalStore.owner_actor_id] = sellerProfile;
      if (sellerProfile.actor_id) db.sellerProfiles[sellerProfile.actor_id] = sellerProfile;
    }

    this.saveDb(db);
    return canonicalStore;
  }

  // =========================================================================
  // OFFER ACTIONS
  // =========================================================================
  public static getOfferBySlug(storeSlug: string, offerSlug: string): Offer | null {
    const db = this.getDb();
    if (!offerSlug) return null;
    const cleanOfferSlug = offerSlug.trim().toLowerCase();
    const slugifiedOffer = slugify(offerSlug);

    // 1. Direct search by slug, ID, or slugified name
    const matched = db.offers.find((o) => {
      if (!o) return false;
      const oSlug = (o.slug || "").trim().toLowerCase();
      const oNameSlug = slugify(o.name || "");
      const oId = o.id || "";

      return (
        oSlug === cleanOfferSlug ||
        oId === offerSlug ||
        oNameSlug === slugifiedOffer ||
        slugify(oSlug) === slugifiedOffer ||
        o.name.trim().toLowerCase() === cleanOfferSlug
      );
    });

    if (matched) return matched;

    // 2. Fuzzy search (if partial match)
    const fuzzy = db.offers.find((o) => {
      const oNameSlug = slugify(o.name || "");
      return oNameSlug.includes(slugifiedOffer) || slugifiedOffer.includes(oNameSlug);
    });

    return fuzzy || null;
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
      const existing = db.offers[existingIndex];
      const mergedImage = offer.image_url !== undefined ? offer.image_url : (existing.image_url || "");
      const mergedItems = offer.items !== undefined ? offer.items : existing.items;

      db.offers[existingIndex] = {
        ...existing,
        ...offer,
        image_url: mergedImage,
        items: mergedItems,
        updated_at: new Date().toISOString(),
      };
    } else {
      db.offers.push({ ...offer, created_at: offer.created_at || new Date().toISOString() });
    }

    this.saveDb(db);
    return offer;
  }

  public static deleteOffer(offerIdOrSlug: string): boolean {
    const db = this.getDb();
    const initialLen = db.offers.length;
    const clean = offerIdOrSlug.trim().toLowerCase();
    db.offers = db.offers.filter((o) => o.id !== offerIdOrSlug && o.slug?.toLowerCase() !== clean);
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
          (review.reviewer_guest_identity_id
            ? r.reviewer_guest_identity_id === review.reviewer_guest_identity_id
            : r.reviewer_actor_id === review.reviewer_actor_id))
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

  // ==========================================
  // GUEST IDENTITIES & REVIEW INVITATIONS
  // ==========================================

  public static getGuestIdentities(): GuestIdentity[] {
    const db = this.getDb();
    return db.guestIdentities || [];
  }

  public static upsertGuestIdentity(guest: GuestIdentity): GuestIdentity {
    const db = this.getDb();
    if (!db.guestIdentities) db.guestIdentities = [];

    const idx = db.guestIdentities.findIndex((g) => g.id === guest.id || (g.verified_phone && g.verified_phone === guest.verified_phone));
    if (idx >= 0) {
      db.guestIdentities[idx] = {
        ...db.guestIdentities[idx],
        ...guest,
        updated_at: new Date().toISOString(),
      };
    } else {
      db.guestIdentities.push(guest);
    }
    this.saveDb(db);
    return guest;
  }

  public static getReviewInvitations(): ReviewInvitation[] {
    const db = this.getDb();
    return db.reviewInvitations || [];
  }

  public static getReviewInvitationByToken(token: string): ReviewInvitation | null {
    const db = this.getDb();
    const invitations = db.reviewInvitations || [];
    return invitations.find((i) => i.secure_token_hash === token || i.secure_token_hash === `tok_${token}`) || null;
  }

  public static upsertReviewInvitation(invitation: ReviewInvitation): ReviewInvitation {
    const db = this.getDb();
    if (!db.reviewInvitations) db.reviewInvitations = [];

    const idx = db.reviewInvitations.findIndex((i) => i.id === invitation.id || i.secure_token_hash === invitation.secure_token_hash);
    if (idx >= 0) {
      db.reviewInvitations[idx] = {
        ...db.reviewInvitations[idx],
        ...invitation,
      };
    } else {
      db.reviewInvitations.push(invitation);
    }
    this.saveDb(db);
    return invitation;
  }

  public static claimGuestHistoryForActor(actorId: string, phone: string) {
    const db = this.getDb();
    const result = GuestClaimService.applyClaim({
      actorId,
      verifiedPhone: phone,
      guestIdentities: db.guestIdentities || [],
      orders: db.orders || [],
      transactions: [],
    });

    db.guestIdentities = result.updatedGuestIdentities;
    db.orders = result.updatedOrders;
    this.saveDb(db);
    return result;
  }
}

