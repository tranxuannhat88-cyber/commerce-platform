import { Metadata } from "next";
import { Offer, Store } from "@/types";

export class OfferSocialMetadataService {
  public static readonly PLATFORM_SHARE_TITLE = "Nền tảng giao dịch trực tuyến Go";
  public static readonly PLATFORM_SITE_NAME = "Go";
  public static readonly DEFAULT_BASE_URL = "https://app.hinex.vn";

  /**
   * Generates description according to strict rule:
   * {OFFER_NAME} · {PRODUCT_1}, {PRODUCT_2}, {PRODUCT_3}...
   */
  public static buildOfferShareDescription(offer: Offer | null, offerSlug?: string): string {
    if (!offer) {
      const fallbackTitle = offerSlug
        ? offerSlug.replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase())
        : "Ưu đãi trực tuyến";
      return `${fallbackTitle} · Xem chi tiết và đặt hàng trực tiếp qua nền tảng Go.`;
    }

    const offerName = (offer.name || "").trim();

    // Collect item names (unique, non-empty)
    const rawItemNames = Array.isArray(offer.items)
      ? offer.items.map((it) => it?.name?.trim()).filter((n): n is string => Boolean(n))
      : [];

    const uniqueItemNames = Array.from(new Set(rawItemNames));

    // Case 1: Multiple items
    if (uniqueItemNames.length > 1) {
      // Filter out item names that are identical to the offer name
      const distinctItems = uniqueItemNames.filter(
        (name) => name.toLowerCase() !== offerName.toLowerCase()
      );

      const itemsToList = distinctItems.length > 0 ? distinctItems : uniqueItemNames;
      const topItems = itemsToList.slice(0, 3);
      const hasMore = itemsToList.length > 3;

      const itemsStr = topItems.join(", ") + (hasMore ? "..." : "");
      return `${offerName} · ${itemsStr}`;
    }

    // Case 2: Exactly 1 item
    if (uniqueItemNames.length === 1) {
      const singleItem = uniqueItemNames[0];
      // If single item name is different from offer name
      if (singleItem.toLowerCase() !== offerName.toLowerCase()) {
        return `${offerName} · ${singleItem}`;
      }
      // If single item name equals offer name, check short description or description
      const desc = (offer.short_description || offer.description || "").trim();
      if (desc) {
        // Use clean concise description (up to 120 chars)
        const cleanDesc = desc.replace(/\r?\n|\r/g, " ").slice(0, 120).trim();
        return `${offerName} · ${cleanDesc}`;
      }
      return `${offerName} · Xem chi tiết và đặt hàng trực tiếp qua nền tảng Go.`;
    }

    // Case 3: Zero items (header offer only)
    const desc = (offer.short_description || offer.description || "").trim();
    if (desc) {
      const cleanDesc = desc.replace(/\r?\n|\r/g, " ").slice(0, 120).trim();
      return `${offerName} · ${cleanDesc}`;
    }

    return `${offerName} · Xem chi tiết và đặt hàng trực tiếp qua nền tảng Go.`;
  }

  /**
   * Resolves absolute OG image URL
   */
  public static resolveOfferShareImageUrl(
    storeSlug: string,
    offerSlug: string,
    offer: Offer | null,
    baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || OfferSocialMetadataService.DEFAULT_BASE_URL
  ): string {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return `${cleanBase}/api/og/offer?store_slug=${encodeURIComponent(storeSlug)}&offer_slug=${encodeURIComponent(offerSlug)}`;
  }

  /**
   * Generates full Next.js Metadata object
   */
  public static buildOfferMetadata(params: {
    storeSlug: string;
    offerSlug: string;
    offer: Offer | null;
    store: Store | null;
    canonicalPath?: string;
  }): Metadata {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || OfferSocialMetadataService.DEFAULT_BASE_URL).replace(/\/+$/, "");
    const offer = params.offer;
    const storeSlug = params.storeSlug || offer?.store_slug || "auto";
    const offerSlug = params.offerSlug || offer?.slug || "";

    const canonicalPath = params.canonicalPath || (storeSlug && storeSlug !== "auto" ? `/${storeSlug}/o/${offerSlug}` : `/o/${offerSlug}`);
    const canonicalUrl = `${baseUrl}${canonicalPath}`;

    const ogTitle = OfferSocialMetadataService.PLATFORM_SHARE_TITLE;
    const ogDescription = OfferSocialMetadataService.buildOfferShareDescription(offer, offerSlug);
    const ogImageUrl = OfferSocialMetadataService.resolveOfferShareImageUrl(storeSlug, offerSlug, offer, baseUrl);

    const browserPageTitle = offer?.name
      ? `${offer.name} | ${params.store?.store_name || "Go"}`
      : `Ưu đãi trực tuyến | Go`;

    return {
      title: browserPageTitle,
      description: ogDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: canonicalUrl,
        siteName: OfferSocialMetadataService.PLATFORM_SITE_NAME,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            secureUrl: ogImageUrl,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: ogTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImageUrl],
      },
      other: {
        "og:image:secure_url": ogImageUrl,
        "image_src": ogImageUrl,
      },
    };
  }
}
