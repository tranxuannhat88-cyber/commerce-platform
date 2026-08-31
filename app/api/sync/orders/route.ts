import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { Order } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store_slug");
    const storeId = searchParams.get("store_id");

    const orders = ServerDbManager.getOrders(storeId || storeSlug || undefined);
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (err: unknown) {
    console.error("GET /api/sync/orders error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order } = body;

    if (!order) {
      return NextResponse.json({ success: false, error: "Missing order data" }, { status: 400 });
    }

    const savedOrder = ServerDbManager.createOrder(order as Order);
    return NextResponse.json({ success: true, order: savedOrder });
  } catch (err: unknown) {
    console.error("POST /api/sync/orders error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
