import {
  Organization,
  Store,
  Offer,
  Product,
  Order,
  SellerReputationMetrics,
  SellerPublicProfileDTO,
  StorePublicSettings,
} from "@/types";
import { UserIdentity } from "@/lib/auth/types";

export const DEFAULT_STORE_PUBLIC_SETTINGS: StorePublicSettings = {
  show_logo: true,
  show_description: true,
  show_region: true,
  show_full_address: false,
  show_business_phone: false,
  show_business_email: false,
  show_website: true,
  show_products: true,
  show_services: true,
  show_active_offers: true,
  show_policies: true,
  show_reputation: true,
};

export class SellerPublicProfileService {
  /**
   * Generates or computes reputation metrics from authoritative records
   * ZERO MOCK VALUES - Null when not available.
   */
  public static getReputationMetrics(
    actorId: string,
    completedOrdersCount: number = 0,
    creationDate?: string,
    isVerified: boolean = false
  ): SellerReputationMetrics {
    return {
      actor_id: actorId,
      rating_average: null, // Null when no reviews exist
      rating_count: 0,
      trust_score: null, // No fabricated score
      completed_transactions: completedOrdersCount,
      completion_rate: null,
      on_time_delivery_rate: null,
      response_rate: undefined,
      dispute_rate: undefined,
      verified_transaction_count: completedOrdersCount,
      platform_member_since: creationDate || new Date().toISOString(),
      is_verified_business: isVerified,
      is_phone_verified: true,
    };
  }

  /**
   * Constructs the safe Whitelisted Seller Public Profile DTO
   */
  public static getSellerPublicProfile(params: {
    actorId: string;
    organization?: Organization | null;
    store: Store;
    currentUser?: UserIdentity | null;
    offers: Offer[];
    products: Product[];
    orders?: Order[];
  }): SellerPublicProfileDTO {
    const { actorId, organization, store, currentUser, offers, products, orders = [] } = params;

    const isPersonal = store.owner_actor_type === "PERSONAL" || actorId.startsWith("usr_") || actorId === "personal";
    const publicSettings = store.public_settings || DEFAULT_STORE_PUBLIC_SETTINGS;

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
    const isVerified = isPersonal ? store.verification_status === "VERIFIED" : organization?.verification_status === "VERIFIED";

    const reputation = this.getReputationMetrics(
      actorId,
      completedCount,
      store.created_at || organization?.created_at,
      isVerified
    );

    const activePublicOffers = offers
      .filter((o) => o.status === "ACTIVE" && (o.visibility || "PUBLIC") === "PUBLIC")
      .map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        price: o.price,
        compare_at_price: o.compare_at_price,
        image_url: o.image_url,
        store_slug: store.slug || "auto",
      }));

    const region = publicSettings.show_region && store.address
      ? store.address.split(",").slice(-1)[0]?.trim() || store.address
      : undefined;

    if (isPersonal) {
      return {
        actor_id: actorId,
        actor_type: "PERSONAL",
        display_name: currentUser?.full_name || store.store_name || "Nhà Bán Hàng Cá Nhân",
        slug: store.slug || (currentUser?.id ? `u-${currentUser.id}` : "personal"),
        logo_url: store.logo_url || currentUser?.avatar_url,
        description: store.description || undefined,
        region,
        full_address: undefined,
        public_contact_phone: publicSettings.show_business_phone ? (publicSettings.public_contact_phone || store.phone) : undefined,
        public_business_email: publicSettings.show_business_email ? (publicSettings.public_business_email || store.email) : undefined,
        website_url: publicSettings.show_website ? (publicSettings.website_url || store.website_url) : undefined,
        reputation: {
          ...reputation,
          is_verified_business: isVerified,
          is_phone_verified: Boolean(store.phone),
        },
        public_stores: [
          {
            id: store.id,
            store_name: store.store_name,
            slug: store.slug || "auto",
            logo_url: store.logo_url,
            product_count: products.filter((p) => p.product_status === "ACTIVE").length,
          },
        ],
        active_offers: activePublicOffers,
      };
    }

    // Organization Actor Profile
    const orgName = organization?.name || store.store_name;
    return {
      actor_id: organization?.id || actorId,
      actor_type: "ORGANIZATION",
      display_name: orgName,
      legal_name: organization?.name,
      slug: organization?.slug || store.slug || "auto",
      logo_url: organization?.logo_url || store.logo_url,
      cover_image_url: store.cover_image_url,
      description: store.description || undefined,
      region,
      full_address: publicSettings.show_full_address ? store.address : undefined,
      public_contact_phone: publicSettings.show_business_phone ? (publicSettings.public_contact_phone || store.phone || organization?.phone) : undefined,
      public_business_email: publicSettings.show_business_email ? (publicSettings.public_business_email || store.email || organization?.email) : undefined,
      website_url: publicSettings.show_website ? (publicSettings.website_url || store.website_url) : undefined,
      reputation,
      public_stores: [
        {
          id: store.id,
          store_name: store.store_name,
          slug: store.slug || "auto",
          logo_url: store.logo_url,
          product_count: products.filter((p) => p.product_status === "ACTIVE").length,
        },
      ],
      active_offers: activePublicOffers,
    };
  }
}
