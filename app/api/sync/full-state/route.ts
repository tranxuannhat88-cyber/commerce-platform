import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { Store, Offer, Product, ActorPaymentAccount, Order, Organization, PersonalActor } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const db = ServerDbManager.getDb();

    // Primary store & seller
    const store = db.stores.find((s) => s.slug && s.slug !== "auto") || db.stores[0] || null;
    const sellerProfile = store ? ServerDbManager.getSellerProfile(store.id || store.owner_actor_id) : undefined;
    const paymentAccounts = store ? ServerDbManager.getPaymentAccounts(store.owner_actor_id || store.id) : db.paymentAccounts;

    return NextResponse.json({
      success: true,
      store,
      offers: db.offers || [],
      products: db.products || [],
      orders: db.orders || [],
      paymentAccounts: paymentAccounts || [],
      organizations: db.organizations || [],
      sellerProfile,
      reviews: db.reviews || [],
      last_updated_at: db.last_updated_at,
    });
  } catch (err: unknown) {
    console.error("GET /api/sync/full-state error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      store,
      offers,
      products,
      orders,
      paymentAccounts,
      organization,
      personalActor,
      sellerProfile,
    } = body;

    const db = ServerDbManager.getDb();

    // 1. Sync Store
    if (store && (store.store_name || store.id || store.slug)) {
      ServerDbManager.upsertStore(store as Store, sellerProfile);
    }

    // 2. Sync Offers (Update active offers state in server db)
    if (Array.isArray(offers)) {
      db.offers = offers;
      ServerDbManager.saveDb(db);
    }

    // 3. Sync Products
    if (Array.isArray(products) && products.length > 0) {
      products.forEach((p: Product) => {
        const idx = db.products.findIndex((ex) => ex.id === p.id || ex.name.toLowerCase() === p.name.toLowerCase());
        if (idx >= 0) {
          db.products[idx] = { ...db.products[idx], ...p, updated_at: new Date().toISOString() };
        } else {
          db.products.push({ ...p, created_at: p.created_at || new Date().toISOString() });
        }
      });
    }

    // 4. Sync Orders (Merge & deduplicate by order_number / id)
    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((ord: Order) => {
        const idx = db.orders.findIndex((ex) => ex.id === ord.id || ex.order_number === ord.order_number);
        if (idx >= 0) {
          db.orders[idx] = { ...db.orders[idx], ...ord, updated_at: new Date().toISOString() };
        } else {
          db.orders.push({ ...ord, created_at: ord.created_at || new Date().toISOString() });
        }
      });
    }

    // 5. Sync Payment Accounts
    if (Array.isArray(paymentAccounts) && paymentAccounts.length > 0) {
      ServerDbManager.upsertPaymentAccounts(paymentAccounts);
    }

    // 6. Sync Organization
    if (organization && organization.id && organization.name !== "Chưa có tổ chức") {
      const orgIdx = db.organizations.findIndex((o) => o.id === organization.id);
      if (orgIdx >= 0) {
        db.organizations[orgIdx] = { ...db.organizations[orgIdx], ...organization };
      } else {
        db.organizations.push(organization);
      }
    }

    ServerDbManager.saveDb(db);

    const activeStore = db.stores.find((s) => s.slug && s.slug !== "auto") || db.stores[0] || null;

    return NextResponse.json({
      success: true,
      store: activeStore,
      offers: db.offers,
      products: db.products,
      orders: db.orders,
      paymentAccounts: db.paymentAccounts,
      last_updated_at: db.last_updated_at,
    });
  } catch (err: unknown) {
    console.error("POST /api/sync/full-state error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
