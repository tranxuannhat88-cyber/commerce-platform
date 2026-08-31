import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store_slug");
    const offerSlug = searchParams.get("offer_slug");

    if (!offerSlug) {
      return NextResponse.json({ success: false, error: "Missing offer_slug parameter" }, { status: 400 });
    }

    const offer = ServerDbManager.getOfferBySlug(storeSlug || "", offerSlug);
    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found on server" }, { status: 404 });
    }

    const store = ServerDbManager.getStoreBySlug(offer.store_slug || storeSlug || offer.store_id);
    const paymentAccounts = ServerDbManager.getPaymentAccounts(store?.owner_actor_id);

    // Resolve active bank info
    const defaultAcc = paymentAccounts.find((a) => a.is_default) || paymentAccounts[0];
    const bankInfo = {
      is_configured: Boolean(defaultAcc?.account_number || store?.payment_settings?.bank_account_no),
      bank_name: defaultAcc?.bank_name || store?.payment_settings?.bank_name || "",
      bank_short_name: defaultAcc?.bank_short_name || store?.payment_settings?.bank_name || "",
      bank_bin: defaultAcc?.bank_bin || "970422",
      account_number: defaultAcc?.account_number || store?.payment_settings?.bank_account_no || "",
      account_name: defaultAcc?.account_name || store?.payment_settings?.bank_account_name || "",
      qr_image_url: defaultAcc?.qr_image_url || "",
    };

    return NextResponse.json({
      success: true,
      offer,
      store: store || {
        id: offer.store_id || "store_default",
        store_name: "Cửa Hàng Trực Tuyến",
        slug: offer.store_slug || storeSlug || "auto",
        status: "ACTIVE",
      },
      paymentAccounts,
      bankInfo,
    });
  } catch (err: unknown) {
    console.error("GET /api/storefront/offer error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
