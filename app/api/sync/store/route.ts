import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { Store, ActorPaymentAccount } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const store = ServerDbManager.getStoreBySlug(slug);
      if (!store) {
        return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
      }
      const paymentAccounts = ServerDbManager.getPaymentAccounts(store.owner_actor_id || store.id);
      const sellerProfile = ServerDbManager.getSellerProfile(store.id || store.owner_actor_id);
      return NextResponse.json({ success: true, store, sellerProfile, paymentAccounts });
    }

    const db = ServerDbManager.getDb();
    return NextResponse.json({ success: true, stores: db.stores });
  } catch (err: unknown) {
    console.error("GET /api/sync/store error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { store, paymentAccounts, sellerProfile } = body;

    let savedStore: Store | null = null;
    if (store) {
      savedStore = ServerDbManager.upsertStore(store as Store, sellerProfile);
    }

    if (Array.isArray(paymentAccounts) && paymentAccounts.length > 0) {
      ServerDbManager.upsertPaymentAccounts(paymentAccounts);
    }

    return NextResponse.json({
      success: true,
      store: savedStore,
      sellerProfile: ServerDbManager.getSellerProfile(store?.id || store?.owner_actor_id),
      paymentAccounts: ServerDbManager.getPaymentAccounts(store?.owner_actor_id || store?.id),
    });
  } catch (err: unknown) {
    console.error("POST /api/sync/store error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
