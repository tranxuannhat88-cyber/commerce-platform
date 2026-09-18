import { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontDataResolver } from "@/lib/server/storefront-data-resolver";
import { PublicStoreView } from "@/components/storefront/public/public-store-view";
import { AppUrlService } from "@/lib/services/url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{
    store_slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store_slug } = await params;
  const data = StorefrontDataResolver.resolvePublicStore(store_slug);

  if (!data) {
    return {
      title: "Cửa Hàng Không Tồn Tại | HINEX",
      description: "Đường dẫn cửa hàng không tồn tại hoặc đã thay đổi.",
    };
  }

  const { store, activeProducts } = data;
  const title = store.store_name || "Cửa Hàng Trực Tuyến";
  const description =
    store.description?.trim() ||
    `Ghé thăm gian hàng của ${title} trên nền tảng HINEX. Xem các sản phẩm, ưu đãi và đặt mua trực tiếp.`;

  const baseUrl = AppUrlService.getBaseUrl();
  const canonicalUrl = AppUrlService.getPublicStoreUrl(store.slug || store_slug);

  const rawImage =
    store.cover_image_url ||
    store.logo_url ||
    (activeProducts.length > 0 ? activeProducts[0].image_url : null) ||
    "/icons/icon-512.png";

  const imageUrl = rawImage.startsWith("http")
    ? rawImage
    : rawImage.startsWith("/")
    ? `${baseUrl}${rawImage}`
    : `${baseUrl}/${rawImage}`;

  return {
    title: `${title} | HINEX Store`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | HINEX Store`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "HINEX",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | HINEX Store`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicStoreCanonicalPage({ params }: Props) {
  const { store_slug } = await params;
  const data = StorefrontDataResolver.resolvePublicStore(store_slug);

  return <PublicStoreView initialData={data} storeSlug={store_slug} />;
}
