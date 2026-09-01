import { Metadata } from "next";
import { ServerDbManager } from "@/lib/server/db";
import { ShortOfferRedirectClient } from "./client-redirect";
import { OfferSocialMetadataService } from "@/lib/storefront/offer-social-metadata-service";

interface Props {
  params: Promise<{
    offer_slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { offer_slug } = await params;

  const db = ServerDbManager.getDb();
  const offer = ServerDbManager.getOfferBySlug("", offer_slug);
  const store = offer?.store_slug ? ServerDbManager.getStoreBySlug(offer.store_slug) : db.stores[0] || null;

  return OfferSocialMetadataService.buildOfferMetadata({
    storeSlug: offer?.store_slug || store?.slug || "auto",
    offerSlug: offer_slug,
    offer,
    store,
    canonicalPath: `/o/${offer_slug}`,
  });
}

export default async function ShortOfferRedirectPage({ params }: Props) {
  const { offer_slug } = await params;

  return <ShortOfferRedirectClient offerSlug={offer_slug} />;
}
