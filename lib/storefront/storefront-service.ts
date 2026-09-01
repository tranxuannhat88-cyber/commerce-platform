import {
  Store,
  Organization,
  Offer,
  Product,
  Category,
  StorePolicySettings,
} from "@/types";
import { PublicStorefrontDTO } from "./types";
import {
  SellerPublicProfileService,
  DEFAULT_STORE_PUBLIC_SETTINGS,
} from "./seller-profile-service";

export const DEFAULT_STORE_POLICIES: StorePolicySettings = {};

export class StorefrontService {
  /**
   * Builds the comprehensive public Storefront payload using 100% REAL data
   */
  public static getPublicStorefront(params: {
    store: Store;
    organization: Organization;
    offers: Offer[];
    categories: Category[];
    products: Product[];
  }): PublicStorefrontDTO {
    const { store, organization, offers, categories, products } = params;

    const publicSettings = store.public_settings || DEFAULT_STORE_PUBLIC_SETTINGS;
    const policies = store.policy_settings || {};
    const reputation = SellerPublicProfileService.getReputationMetrics(organization.id, 0);

    // Filter Active & Public Offers
    const activeOffers = offers
      .filter((o) => o.status === "ACTIVE" && (o.visibility || "PUBLIC") === "PUBLIC")
      .map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        price: o.price,
        compare_at_price: o.compare_at_price,
        image_url: o.image_url,
        store_slug: o.store_slug || store.slug || "auto",
      }));

    // Filter Visible Products (Hide DISCONTINUED & HIDDEN)
    const visibleProducts = products
      .filter((p) => p.product_status !== "DISCONTINUED" && p.product_status !== "HIDDEN")
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        compare_at_price: p.compare_at_price,
        unit: p.unit,
        description: p.description,
        image_url: p.image_url,
        gallery: p.gallery,
        category_id: p.category,
        is_available: p.availability_status !== "OUT_OF_STOCK" && p.is_available !== false,
        availability_status: p.availability_status || "IN_STOCK",
        available_quantity: p.available_quantity,
      }));

    // Build Categories with Product Counts
    const categoryList = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      product_count: visibleProducts.filter((p) => p.category_id === cat.id || p.category_id === cat.name).length,
    }));

    return {
      id: store.id,
      organization_id: store.organization_id || store.owner_actor_id || store.id,
      store_name: store.store_name,
      slug: store.slug,
      logo_url: publicSettings.show_logo ? (store.logo_url || organization.logo_url) : undefined,
      cover_image_url: store.cover_image_url,
      description: publicSettings.show_description ? store.description : undefined,
      region: publicSettings.show_region ? store.address : undefined,
      full_address: publicSettings.show_full_address ? store.address : undefined,
      public_contact_phone: publicSettings.show_business_phone
        ? (publicSettings.public_contact_phone || store.phone || organization.phone)
        : undefined,
      public_business_email: publicSettings.show_business_email
        ? (publicSettings.public_business_email || store.email || organization.email)
        : undefined,
      website_url: publicSettings.show_website ? publicSettings.website_url : undefined,
      seller_reputation: reputation,
      active_offers: publicSettings.show_active_offers ? activeOffers : [],
      categories: categoryList,
      products: publicSettings.show_products ? visibleProducts : [],
      policies: policies,
      public_settings: publicSettings,
    };
  }
}
