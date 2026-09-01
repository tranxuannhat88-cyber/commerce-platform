import { Metadata } from "next";
import { ServerDbManager } from "@/lib/server/db";
import { StorefrontClient } from "@/components/storefront/storefront-client";

interface Props {
  params: Promise<{
    store_slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store_slug } = await params;

  const store = ServerDbManager.getStoreBySlug(store_slug);

  if (!store) {
    return {
      title: "Cửa Hàng Trực Tuyến",
      description: "Xem các ưu đãi và danh mục sản phẩm chính hãng",
    };
  }

  const title = store.store_name || "Cửa Hàng Trực Tuyến";
  const rawImageUrl = store.logo_url || store.cover_image_url || "/icons/icon-512.png";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://go.invamax.com";
  const imageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : rawImageUrl.startsWith("/")
    ? `${baseUrl}${rawImageUrl}`
    : `${baseUrl}/${rawImageUrl}`;

  const description =
    store.description ||
    store.policy_settings?.shipping_policy ||
    `Chào mừng bạn đến với ${title}. Xem các sản phẩm, ưu đãi và đặt hàng trực tiếp.`;

  return {
    title: `${title} | Cửa Hàng Trực Tuyến`,
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
      siteName: title,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { store_slug } = await params;

  return <StorefrontClient storeSlug={store_slug} />;
}
