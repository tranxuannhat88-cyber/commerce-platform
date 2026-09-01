import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { GuestClaimService } from "@/lib/services/guest-claim-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const actorId = searchParams.get("actor_id") || undefined;

    if (!phone) {
      return NextResponse.json({ success: false, error: "Thiếu số điện thoại." }, { status: 400 });
    }

    const db = ServerDbManager.getDb();
    const allReviews = ServerDbManager.getAllReviews();

    const summary = GuestClaimService.findClaimableHistory({
      verifiedPhone: phone,
      guestIdentities: db.guestIdentities || [],
      orders: db.orders || [],
      transactions: [],
      reviews: allReviews,
      currentActorId: actorId,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Error checking claimable history:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actorId, phone } = body;

    if (!actorId || !phone) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin actorId hoặc số điện thoại." }, { status: 400 });
    }

    const result = ServerDbManager.claimGuestHistoryForActor(actorId, phone);

    return NextResponse.json({
      success: true,
      message: `Đã liên kết thành công ${result.claimedCount} định danh giao dịch vào tài khoản.`,
      result,
    });
  } catch (error: any) {
    console.error("Error claiming guest history:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
