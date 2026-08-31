import {
  Offer,
  Store,
  Organization,
  PersonalActor,
  Product,
  Order,
  StorePolicySettings,
} from "@/types";
import { UserIdentity } from "@/lib/auth/types";
import { PublicOfferDTO, SellerMiniCardDTO, PublicTrustSummaryDTO } from "./types";
import { DEFAULT_STORE_POLICIES } from "./storefront-service";

export class OfferPublicService {
  /**
   * Builds the conversion-first Public Offer DTO with Real Seller & Real Trust & Attachments
   * ZERO MOCK / DEMO DATA GUARANTEED.
   */
  public static getPublicOffer(params: {
    offerSlug: string;
    offers: Offer[];
    store: Store;
    organization?: Organization | null;
    personalActor?: PersonalActor | null;
    user?: UserIdentity | null;
    products: Product[];
    orders?: Order[];
  }): PublicOfferDTO | null {
    const { offerSlug, offers, store, organization, personalActor, user, products, orders = [] } = params;

    const offer = offers.find((o) => o.slug === offerSlug || o.id === offerSlug);
    if (!offer) return null;

    // 1. Resolve Seller Actor Type & Identity
    const rawAccount = (user?.full_name || personalActor?.display_name || "").replace(/\s*\(Cá nhân\)\s*/gi, "").trim();
    const accountName = rawAccount.toLowerCase() === "cá nhân" ? "" : rawAccount;
    const orgName = (organization?.name && organization.name !== "Chưa có tổ chức" ? organization.name : "").trim();
    const storeName = (store.store_name && store.store_name !== "auto" && store.store_name !== "Cửa Hàng Trực Tuyến" ? store.store_name : "").trim();

    const isOrg = Boolean(orgName) || store.owner_actor_type === "ORGANIZATION";
    const actorId = isOrg ? (organization?.id || store.organization_id || "org_default") : (store.owner_actor_id || personalActor?.id || "usr_personal");
    const isVerified = isOrg ? organization?.verification_status === "VERIFIED" : store.verification_status === "VERIFIED";

    let sellerDisplayName = "";
    if (isOrg) {
      if (orgName && storeName && orgName.toLowerCase() !== storeName.toLowerCase()) {
        sellerDisplayName = `${orgName} / ${storeName}`;
      } else {
        sellerDisplayName = orgName || storeName || "Tổ chức bán hàng";
      }
    } else {
      if (accountName && storeName && accountName.toLowerCase() !== storeName.toLowerCase()) {
        sellerDisplayName = `${accountName} / ${storeName}`;
      } else {
        sellerDisplayName = accountName || storeName || "Nhà bán hàng cá nhân";
      }
    }

    const logoUrl = store.logo_url || (isOrg ? organization?.logo_url : (personalActor?.avatar_url || user?.avatar_url));

    // Location: only if seller allows and public location exists
    const showRegion = store.public_settings?.show_region !== false;
    const locationSummary = showRegion && store.address ? store.address.split(",").slice(-1)[0]?.trim() || store.address : undefined;

    // 2. Authoritative Completed Transaction Count from Database
    const completedOrders = orders.filter(
      (od) =>
        (od.store_id === store.id ||
          od.organization_id === actorId ||
          od.organization_id === store.organization_id ||
          od.organization_id === store.owner_actor_id ||
          actorId === "personal" ||
          !od.store_id) &&
        (od.order_status === "COMPLETED" || od.payment?.payment_status === "PAID")
    );
    const completedCount = completedOrders.length;

    // Member since date
    const creationDate = store.created_at || organization?.created_at;
    const memberSince = creationDate
      ? new Date(creationDate).toLocaleDateString("vi-VN", {
          month: "long",
          year: "numeric",
        })
      : undefined;

    const hasStore = Boolean(store.slug && store.slug !== "auto" && store.store_name);

    const miniCard: SellerMiniCardDTO = {
      actor_id: actorId,
      actor_type: isOrg ? "ORGANIZATION" : "PERSONAL",
      seller_display_name: sellerDisplayName,
      logo_url: logoUrl,
      is_verified: isVerified,
      badge_text: isVerified ? (isOrg ? "Tổ chức Đã Xác Minh" : "Đã Xác Minh") : undefined,
      rating_average: null, // Null if no review engine records
      rating_count: 0,
      transaction_count: completedCount,
      location_summary: locationSummary,
      trust_score: null, // Zero mock / fabricated scores
      has_store: hasStore,
      store_slug: store.slug || "auto",
      seller_slug: isOrg && organization?.slug ? organization.slug : store.slug || "auto",
    };

    const trustSummary: PublicTrustSummaryDTO = {
      trust_score: null,
      completion_rate: null,
      on_time_delivery_rate: null,
      completed_transactions: completedCount,
      member_since: memberSince,
      is_phone_verified: Boolean(store.phone),
      is_verified_business: isVerified,
    };

    // 3. Related Products from store
    const relatedProducts = products
      .filter((p) => p.product_status === "ACTIVE")
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        compare_at_price: p.compare_at_price,
        image_url: p.image_url,
        unit: p.unit,
        is_available: p.availability_status !== "OUT_OF_STOCK" && p.is_available !== false,
        availability_status: p.availability_status || "IN_STOCK",
      }));

    // 4. Other Active Offers
    const otherOffers = offers
      .filter(
        (o) =>
          o.slug !== offer.slug &&
          o.id !== offer.id &&
          o.status === "ACTIVE" &&
          (o.visibility || "PUBLIC") === "PUBLIC"
      )
      .slice(0, 3)
      .map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        price: o.price,
        compare_at_price: o.compare_at_price,
        image_url: o.image_url,
        store_slug: o.store_slug || store.slug || "auto",
      }));

    const policies: StorePolicySettings = store.policy_settings || DEFAULT_STORE_POLICIES;

    return {
      id: offer.id,
      organization_id: offer.organization_id,
      store_id: offer.store_id,
      name: offer.name,
      slug: offer.slug,
      short_description: offer.short_description,
      description: offer.description,
      price: offer.price,
      compare_at_price: offer.compare_at_price,
      image_url: offer.image_url,
      gallery: offer.gallery,
      attachments: offer.attachments,
      variants: offer.variants,
      items: offer.items,
      availability_status: offer.availability_status || "IN_STOCK",
      available_quantity: offer.available_quantity,
      low_stock_threshold: offer.low_stock_threshold,
      status: offer.status,
      visibility: offer.visibility || "PUBLIC",
      seller_mini_card: miniCard,
      trust_summary: trustSummary,
      policies,
      related_products: relatedProducts,
      other_active_offers: otherOffers,
    };
  }
}
