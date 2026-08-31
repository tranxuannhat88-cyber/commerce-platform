import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { Offer } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store_slug");
    const offerSlug = searchParams.get("offer_slug");

    if (offerSlug) {
      const offer = ServerDbManager.getOfferBySlug(storeSlug || "", offerSlug);
      if (!offer) {
        return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, offer });
    }

    if (storeSlug) {
      const offers = ServerDbManager.getActiveOffersByStore(storeSlug);
      return NextResponse.json({ success: true, offers });
    }

    const db = ServerDbManager.getDb();
    return NextResponse.json({ success: true, offers: db.offers });
  } catch (err: unknown) {
    console.error("GET /api/sync/offers error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offer, offers } = body;

    if (offer) {
      const saved = ServerDbManager.upsertOffer(offer as Offer);
      return NextResponse.json({ success: true, offer: saved });
    }

    if (Array.isArray(offers)) {
      const savedOffers = offers.map((o) => ServerDbManager.upsertOffer(o as Offer));
      return NextResponse.json({ success: true, count: savedOffers.length, offers: savedOffers });
    }

    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST /api/sync/offers error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing offer ID" }, { status: 400 });
    }

    const deleted = ServerDbManager.deleteOffer(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    console.error("DELETE /api/sync/offers error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
