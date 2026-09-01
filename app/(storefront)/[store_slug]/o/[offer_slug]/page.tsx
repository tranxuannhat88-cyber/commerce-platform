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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store_slug, offer_slug } = await params;

  const offer = ServerDbManager.getOfferBySlug(store_slug, offer_slug);
  const store = ServerDbManager.getStoreBySlug(store_slug);

  if (!offer) {
    return {
      title: "Ưu Đãi & Báo Giá Trực Tuyến",
      description: "Xem chi tiết ưu đãi và đặt hàng trực tiếp",
    };
  }

  // 1. Tiêu đề Offer (Vị trí số 2)
  const title = offer.name;

  // 2. Ảnh đại diện của Offer (Vị trí số 1)
  const firstItemImage = offer.items?.find((i) => i.image_url)?.image_url;
  const rawImageUrl = offer.image_url || firstItemImage || store?.logo_url || "/icons/icon-512.png";
  
  // Ensure absolute image URL for external crawlers (Zalo, Facebook, Telegram, etc.)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go.invamax.com";
  const imageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : rawImageUrl.startsWith("/")
    ? `${baseUrl}${rawImageUrl}`
    : `${baseUrl}/${rawImageUrl}`;

  // 3. Phía dưới Tiêu đề: Tên sản phẩm / Danh mục chi tiết + Giá bán
  const productNames =
    offer.items && offer.items.length > 0
      ? offer.items.map((i) => i.name).filter(Boolean).join(", ")
      : "";

  const priceFormatted = formatVND(offer.price);
  const isCatalog = offer.offer_structure === "MENU_CATALOG" || (offer.items && offer.items.length > 1);
  const pricePrefix = isCatalog ? "Từ " : "";

  let description = "";
  if (productNames && productNames !== offer.name) {
    description = `Sản phẩm: ${productNames} • Giá: ${pricePrefix}${priceFormatted}`;
  } else if (offer.short_description) {
    description = `${offer.short_description} • Giá: ${pricePrefix}${priceFormatted}`;
  } else {
    description = `Giá: ${pricePrefix}${priceFormatted} • Đặt hàng & xác thực giao dịch trực tiếp từ ${store?.store_name || "Cửa hàng"}`;
  }

  const siteName = store?.store_name || "Commerce Platform";

  return {
    title: `${title} | ${siteName}`,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
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
      images: [imageUrl],
    },
  };
}

export default async function DirectOfferPage({ params }: Props) {
  const { store_slug, offer_slug } = await params;

  return <OfferPageClient storeSlug={store_slug} offerSlug={offer_slug} />;
}
