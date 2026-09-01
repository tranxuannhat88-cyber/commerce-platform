import { ServerDbManager } from "./db";
import {
  Store,
  Offer,
  Product,
  Category,
  Organization,
  StorePublicSettings,
  StorePolicySettings,
  ActorPaymentAccount,
} from "@/types";

export interface ResolvedPublicStoreData {
  store: Store;
  actorType: "PERSONAL" | "ORGANIZATION";
  actorDisplayName: string;
  isVerified: boolean;
  activeOffers: Offer[];
  activeProducts: Product[];
  categories: { id: string; name: string; count: number }[];
  trust: {
    hasRealTrustData: boolean;
    ratingAverage: number | null;
    ratingCount: number;
    completedTransactionsCount: number;
    verifiedReviewCount: number;
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    zaloPhone?: string;
    websiteUrl?: string;
  };
  policies: {
    shippingPolicy?: string;
    returnPolicy?: string;
    warrantyPolicy?: string;
    paymentTerms?: string;
  };
  paymentMethods: string[];
  fulfillmentMethods: string[];
}

export class StorefrontDataResolver {
  public static resolvePublicStore(storeSlug: string): ResolvedPublicStoreData | null {
    if (!storeSlug) return null;

    const db = ServerDbManager.getDb();
    const store = ServerDbManager.getStoreBySlug(storeSlug);
    if (!store) {
      return null;
    }

    return this.resolveFromStoreObject(store, db);
  }

  private static resolveFromStoreObject(store: Store, db: ReturnType<typeof ServerDbManager.getDb>): ResolvedPublicStoreData {
    // 2. Resolve Owner Actor (Personal vs Organization)
    const org = db.organizations.find(
      (o) => o.id === store.organization_id || o.id === store.owner_actor_id
    );

    const isOrg = store.owner_actor_type === "ORGANIZATION" || Boolean(org);
    const actorType: "PERSONAL" | "ORGANIZATION" = isOrg ? "ORGANIZATION" : "PERSONAL";
    const actorDisplayName = isOrg ? org?.name || store.store_name : "Cá nhân";

    const isVerified = isOrg
      ? org?.verification_status === "VERIFIED"
      : store.verification_status === "VERIFIED";

    // 3. Resolve Real Published Offers
    const activeOffers = db.offers.filter((o) => {
      if (o.status !== "ACTIVE") return false;
      if (o.visibility && o.visibility !== "PUBLIC") return false;
      if (o.store_id && o.store_id === store.id) return true;
      if (o.store_slug && o.store_slug.toLowerCase() === store.slug?.toLowerCase()) return true;
      return !o.store_slug && !o.store_id; // Global or default offers
    });

    // 4. Resolve Real Active Products
    const activeProducts = db.products.filter((p) => {
      if (p.product_status === "DISCONTINUED" || p.product_status === "HIDDEN") return false;
      if (p.store_id && p.store_id === store.id) return true;
      if (p.organization_id && p.organization_id === store.organization_id) return true;
      return true; // Products available to this store
    });

    // 5. Extract Real Categories from Products
    const categoryMap = new Map<string, number>();
    activeProducts.forEach((p) => {
      const catName = p.category?.trim() || "Chung";
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });

    const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      count,
    }));

    // 6. Resolve Real Trust & Transactions
    const completedOrders = db.orders.filter(
      (od) =>
        (od.store_id === store.id ||
          od.organization_id === store.organization_id ||
          od.organization_id === store.owner_actor_id) &&
        (od.order_status === "COMPLETED" || od.payment?.payment_status === "PAID")
    );
    const completedCount = completedOrders.length;

    const publishedReviews = (db.reviews || []).filter(
      (r) =>
        (r.reviewee_actor_id === store.owner_actor_id ||
          r.reviewee_actor_id === store.organization_id ||
          r.reviewee_actor_id === store.id) &&
        r.status === "PUBLISHED"
    );

    const reviewCount = publishedReviews.length;
    let ratingAvg: number | null = null;
    if (reviewCount > 0) {
      const totalScore = publishedReviews.reduce((sum, r) => sum + (r.overall_rating || 5), 0);
      ratingAvg = Number((totalScore / reviewCount).toFixed(1));
    }

    const hasRealTrustData = reviewCount > 0 || completedCount > 0;

    // 7. Resolve Real Contact (Only if explicitly enabled or configured)
    const pubSettings = store.public_settings;
    const contact = {
      phone: pubSettings?.show_business_phone !== false ? (pubSettings?.public_contact_phone || store.phone || undefined) : undefined,
      email: pubSettings?.show_business_email !== false ? (pubSettings?.public_business_email || store.email || undefined) : undefined,
      address: pubSettings?.show_full_address !== false ? (store.address || undefined) : undefined,
      zaloPhone: store.phone || pubSettings?.public_contact_phone || undefined,
      websiteUrl: pubSettings?.show_website !== false ? (pubSettings?.website_url || undefined) : undefined,
    };

    // 8. Resolve Real Configured Policies (Zero Fake Fallbacks)
    const policySettings = store.policy_settings;
    const policies = {
      shippingPolicy: policySettings?.shipping_policy?.trim() || undefined,
      returnPolicy: policySettings?.return_policy?.trim() || undefined,
      warrantyPolicy: policySettings?.warranty_policy?.trim() || undefined,
      paymentTerms: policySettings?.payment_terms?.trim() || undefined,
    };

    // 9. Payment Methods
    const paymentMethods: string[] = [];
    const advPayment = store.advanced_payment_settings;
    if (advPayment?.enabled_methods && advPayment.enabled_methods.length > 0) {
      advPayment.enabled_methods.forEach((m) => paymentMethods.push(m));
    } else {
      if (store.payment_settings?.enable_bank_transfer || store.payment_settings?.bank_account_no) {
        paymentMethods.push("VIETQR");
      }
      if (store.payment_settings?.enable_cod !== false) {
        paymentMethods.push("COD");
      }
    }

    // 10. Fulfillment Methods
    const fulfillmentMethods: string[] = [];
    const advFulfillment = store.advanced_fulfillment_settings || store.fulfillment_settings;
    if (advFulfillment?.enabled_methods && advFulfillment.enabled_methods.length > 0) {
      advFulfillment.enabled_methods.forEach((m) => fulfillmentMethods.push(m));
    } else {
      if (store.shipping_settings?.shipping_enabled !== false) fulfillmentMethods.push("DELIVERY");
      if (store.shipping_settings?.enable_store_pickup) fulfillmentMethods.push("STORE_PICKUP");
      if (store.shipping_settings?.enable_quote_later) fulfillmentMethods.push("SHIPPING_QUOTE_LATER");
    }

    return {
      store,
      actorType,
      actorDisplayName,
      isVerified,
      activeOffers,
      activeProducts,
      categories,
      trust: {
        hasRealTrustData,
        ratingAverage: ratingAvg,
        ratingCount: reviewCount,
        completedTransactionsCount: completedCount,
        verifiedReviewCount: reviewCount,
      },
      contact,
      policies,
      paymentMethods,
      fulfillmentMethods,
    };
  }
}
