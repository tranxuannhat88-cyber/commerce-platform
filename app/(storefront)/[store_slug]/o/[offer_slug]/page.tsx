import { Metadata } from "next";
import { ServerDbManager } from "@/lib/server/db";
import { OfferPageClient } from "@/components/storefront/offer-page-client";
import { OfferSocialMetadataService } from "@/lib/storefront/offer-social-metadata-service";

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

  return OfferSocialMetadataService.buildOfferMetadata({
    storeSlug: store_slug,
    offerSlug: offer_slug,
    offer,
    store,
    canonicalPath: `/${store_slug}/o/${offer_slug}`,
  });
}

export default async function DirectOfferPage({ params }: Props) {
  const { store_slug, offer_slug } = await params;

  return <OfferPageClient storeSlug={store_slug} offerSlug={offer_slug} />;
}
