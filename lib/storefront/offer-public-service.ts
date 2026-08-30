import {
  Offer,
  Store,
  Organization,
  Product,
  StorePolicySettings,
} from "@/types";
import { PublicOfferDTO, SellerMiniCardDTO } from "./types";
import { SellerPublicProfileService } from "./seller-profile-service";
import { DEFAULT_STORE_POLICIES } from "./storefront-service";

export class OfferPublicService {
  /**
   * Builds the conversion-first Public Offer DTO with Seller Mini Card & Trust & Cross-sell
   */
  public static getPublicOffer(params: {
    offerSlug: string;
    offers: Offer[];
    store: Store;
    organization: Organization;
    products: Product[];
  }): PublicOfferDTO | null {
    const { offerSlug, offers, store, organization, products } = params;

    const offer = offers.find((o) => o.slug === offerSlug);
    if (!offer) return null;

    const reputation = SellerPublicProfileService.getReputationMetrics(organization.id, 326);

    const miniCard: SellerMiniCardDTO = {
      actor_id: organization.id,
      actor_type: "ORGANIZATION",
      seller_display_name: store.store_name || organization.name,
      logo_url: store.logo_url || organization.logo_url,
      is_verified: true,
      badge_text: "Doanh nghiệp Xác thực",
      rating_average: reputation.rating_average,
      rating_count: reputation.rating_count,
      transaction_count: reputation.completed_transactions,
      location_summary: "Hải Phòng",
      trust_score: reputation.trust_score,
      has_store: true,
      store_slug: store.slug,
      seller_slug: organization.slug,
    };

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

    const otherOffers = offers
      .filter(
        (o) =>
          o.slug !== offerSlug &&
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
        store_slug: store.slug,
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
      trust_summary: {
        trust_score: reputation.trust_score,
        completion_rate: reputation.completion_rate,
        on_time_delivery_rate: reputation.on_time_delivery_rate,
        completed_transactions: reputation.completed_transactions,
        member_since: "Tháng 1, 2026",
      },
      policies,
      related_products: relatedProducts,
      other_active_offers: otherOffers,
    };
  }
}
