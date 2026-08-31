import {
  Store,
  Offer,
  Product,
  Category,
  StorePublicSettings,
  StorePolicySettings,
  SellerReputationMetrics,
  SellerPublicProfileDTO,
} from "@/types";

export interface SellerMiniCardDTO {
  actor_id: string;
  actor_type: "PERSONAL" | "ORGANIZATION";
  seller_display_name: string;
  logo_url?: string;
  is_verified: boolean;
  badge_text?: string;
  rating_average?: number | null;
  rating_count?: number;
  transaction_count: number;
  location_summary?: string;
  trust_score?: number | null;
  has_store: boolean;
  store_slug?: string;
  seller_slug?: string;
}

export interface PublicTrustSummaryDTO {
  trust_score?: number | null;
  completion_rate?: number | null;
  on_time_delivery_rate?: number | null;
  completed_transactions: number;
  member_since?: string;
  is_phone_verified?: boolean;
  is_verified_business?: boolean;
}

export interface PublicOfferDTO {
  id: string;
  organization_id?: string;
  store_id?: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  image_url?: string;
  gallery?: string[];
  attachments?: import("@/types").OfferAttachment[];
  variants?: import("@/types").OfferVariant[];
  items?: import("@/types").OfferItem[];
  availability_status?: import("@/types").AvailabilityStatus;
  available_quantity?: number;
  low_stock_threshold?: number;
  status: import("@/types").OfferStatus;
  visibility: import("@/types").OfferVisibility;
  seller_mini_card: SellerMiniCardDTO;
  trust_summary: PublicTrustSummaryDTO;
  policies: StorePolicySettings;
  related_products: Array<{
    id: string;
    name: string;
    price: number;
    compare_at_price?: number;
    image_url?: string;
    unit?: string;
    is_available: boolean;
    availability_status?: import("@/types").AvailabilityStatus;
  }>;
  other_active_offers: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number;
    image_url?: string;
    store_slug: string;
  }>;
}

export interface PublicStorefrontDTO {
  id: string;
  organization_id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  region?: string;
  full_address?: string;
  public_contact_phone?: string;
  public_business_email?: string;
  website_url?: string;
  seller_reputation: SellerReputationMetrics;
  active_offers: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price?: number;
    image_url?: string;
    store_slug: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    product_count: number;
  }>;
  products: Array<{
    id: string;
    name: string;
    sku?: string;
    price: number;
    compare_at_price?: number;
    unit?: string;
    description?: string;
    image_url?: string;
    gallery?: string[];
    category_id?: string;
    is_available: boolean;
    availability_status: import("@/types").AvailabilityStatus;
    available_quantity?: number;
  }>;
  policies: StorePolicySettings;
  public_settings: StorePublicSettings;
}
