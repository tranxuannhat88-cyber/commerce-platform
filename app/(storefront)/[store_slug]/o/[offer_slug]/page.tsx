import { Metadata } from "next";
import { ServerDbManager } from "@/lib/server/db";
import { OfferPageClient } from "@/components/storefront/offer-page-client";
import { formatVND } from "@/lib/utils";

interface Props {
  params: Promise<{
    store_slug: string;
    offer_slug: string;
  }>;
}

function formatSlugToTitle(slug: string): string {
  if (!slug) return "Ưu Đãi & Báo Giá";
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store_slug, offer_slug } = await params;

  const offer = ServerDbManager.getOfferBySlug(store_slug, offer_slug);
  const store = ServerDbManager.getStoreBySlug(store_slug);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go.invamax.com";
  const siteName = store?.store_name || "Invamax Workspace";

  // 1. Tiêu đề Offer (Vị trí số 2)
  const title = offer?.name || formatSlugToTitle(offer_slug);

  // 2. Ảnh đại diện của Offer (Vị trí số 1)
  // Route /api/og/offer serves binary JPEG/PNG (handles base64 and dynamic fallback for Zalo/Facebook)
  const ogImageUrl = `${baseUrl}/api/og/offer?store_slug=${encodeURIComponent(store_slug)}&offer_slug=${encodeURIComponent(offer_slug)}`;

  // 3. Phía dưới Tiêu đề: Tên sản phẩm / Danh mục chi tiết + Giá bán
  let description = "";
  if (offer) {
    const productNames =
      offer.items && offer.items.length > 0
        ? offer.items.map((i) => i.name).filter(Boolean).join(", ")
        : "";

    const priceFormatted = formatVND(offer.price);
    const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 1);
    const pricePrefix = isCatalog ? "Từ " : "";

    if (productNames && productNames !== offer.name) {
      description = `Sản phẩm: ${productNames} • Giá: ${pricePrefix}${priceFormatted}`;
    } else if (offer.short_description) {
      description = `${offer.short_description} • Giá: ${pricePrefix}${priceFormatted}`;
    } else {
      description = `Giá: ${pricePrefix}${priceFormatted} • Đặt hàng & xác thực giao dịch trực tiếp từ ${siteName}`;
    }
  } else {
    description = `Báo giá, danh mục sản phẩm & Đặt hàng trực tiếp từ ${siteName}`;
  }

  return {
    title: `${title} | ${siteName}`,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: title,
        },
      ],
      type: "website",
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      "og:image:secure_url": ogImageUrl,
      "image_src": ogImageUrl,
    },
  };
}

export default async function DirectOfferPage({ params }: Props) {
  const { store_slug, offer_slug } = await params;

  return <OfferPageClient storeSlug={store_slug} offerSlug={offer_slug} />;
}
