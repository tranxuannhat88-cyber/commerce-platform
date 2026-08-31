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
      const paymentAccounts = ServerDbManager.getPaymentAccounts(store.owner_actor_id);
      return NextResponse.json({ success: true, store, paymentAccounts });
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
    const { store, paymentAccounts } = body;

    let savedStore: Store | null = null;
    if (store) {
      savedStore = ServerDbManager.upsertStore(store as Store);
    }

    if (Array.isArray(paymentAccounts)) {
      paymentAccounts.forEach((acc: ActorPaymentAccount) => {
        ServerDbManager.upsertPaymentAccount(acc);
      });
    }

    return NextResponse.json({
      success: true,
      store: savedStore,
      paymentAccounts: ServerDbManager.getPaymentAccounts(store?.owner_actor_id),
    });
  } catch (err: unknown) {
    console.error("POST /api/sync/store error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
