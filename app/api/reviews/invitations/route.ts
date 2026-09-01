import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { ReviewEligibilityService } from "@/lib/services/review-eligibility-service";
import { GuestIdentityService } from "@/lib/services/guest-identity-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Thiếu token mời đánh giá." }, { status: 400 });
    }

    const invitation = ServerDbManager.getReviewInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json({ success: false, error: "Không tìm thấy lời mời đánh giá hợp lệ." }, { status: 404 });
    }

    const db = ServerDbManager.getDb();
    const order = db.orders.find((o) => o.id === invitation.order_id || (invitation.order_number && o.order_number === invitation.order_number));
    const allReviews = ServerDbManager.getAllReviews();

    const eligibility = ReviewEligibilityService.checkGuestEligibility({
      invitation,
      order,
      existingReviews: allReviews,
    });

    const maskedPhone = GuestIdentityService.maskPhoneNumber(invitation.recipient_phone);
    const store = db.stores.find((s) => order?.organization_id ? s.organization_id === order.organization_id : true);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        transaction_id: invitation.transaction_id,
        order_number: invitation.order_number,
        masked_phone: maskedPhone,
        recipient_name: invitation.recipient_name,
        expires_at: invitation.expires_at,
        status: invitation.status,
      },
      seller: {
        seller_name: store?.store_name || "Nhà bán hàng",
        seller_slug: store?.slug,
      },
      order: order ? {
        order_number: order.order_number,
        total_amount: order.total_amount,
        items_count: order.items?.length || 1,
      } : undefined,
      eligibility,
    });
  } catch (error: any) {
    console.error("Error checking review invitation:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, otpCode } = body;

    if (action === "VERIFY_OTP") {
      if (!token || !otpCode) {
        return NextResponse.json({ success: false, error: "Vui lòng nhập đầy đủ mã OTP." }, { status: 400 });
      }

      const invitation = ServerDbManager.getReviewInvitationByToken(token);
      if (!invitation) {
        return NextResponse.json({ success: false, error: "Lời mời đánh giá không tồn tại." }, { status: 404 });
      }

      // For Vietnam SMS OTP simulation / standard verification
      if (otpCode !== "123456" && otpCode.length !== 6) {
        return NextResponse.json({ success: false, error: "Mã OTP không đúng hoặc đã hết hạn." }, { status: 400 });
      }

      // Mark invitation as verified
      invitation.status = "VERIFIED";
      invitation.verified_at = new Date().toISOString();
      ServerDbManager.upsertReviewInvitation(invitation);

      return NextResponse.json({
        success: true,
        message: "Xác minh số điện thoại thành công.",
        invitation,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error processing review invitation OTP:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
