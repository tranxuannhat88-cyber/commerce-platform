import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { TransactionReviewService } from "@/lib/services/transaction-review-service";
import { ReviewEligibilityService } from "@/lib/services/review-eligibility-service";
import { TransactionReview, ReviewResponse, ReviewReport } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?actor_id=...&store_slug=...&current_actor_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actorId = searchParams.get("actor_id");
    const storeSlug = searchParams.get("store_slug");
    const currentActorId = searchParams.get("current_actor_id") || undefined;
    const transactionId = searchParams.get("transaction_id");

    let targetActorId = actorId;
    if (!targetActorId && storeSlug) {
      const store = ServerDbManager.getStoreBySlug(storeSlug);
      if (store) {
        targetActorId = store.id || store.owner_actor_id;
      }
    }

    if (transactionId) {
      const all = ServerDbManager.getAllReviews();
      const forTx = all.filter((r) => r.transaction_id === transactionId);
      // Double blind filtering
      const filtered = forTx.filter((r) => {
        if (r.status === "PUBLISHED") return true;
        if (r.status === "HIDDEN_PENDING_REVEAL" && currentActorId && r.reviewer_actor_id === currentActorId) {
          return true;
        }
        return false;
      });
      return NextResponse.json({ success: true, reviews: filtered });
    }

    if (!targetActorId) {
      const allPublished = ServerDbManager.getAllReviews().filter((r) => r.status === "PUBLISHED");
      return NextResponse.json({ success: true, reviews: allPublished });
    }

    const reviews = ServerDbManager.getActorReviews(targetActorId, currentActorId);
    const stats = ServerDbManager.getActorReviewStats(targetActorId);

    return NextResponse.json({
      success: true,
      actor_id: targetActorId,
      stats,
      reviews,
    });
  } catch (error: any) {
    console.error("Error in GET /api/reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Body: TransactionReview payload or ReviewReport payload
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = "CREATE_REVIEW" } = body;

    if (action === "REPORT_REVIEW") {
      const report: ReviewReport = {
        id: `rep-${Date.now()}`,
        review_id: body.review_id,
        reporter_actor_id: body.reporter_actor_id || "anonymous",
        reporter_user_id: body.reporter_user_id || "usr_anon",
        reason: body.reason || "OTHER",
        description: body.description,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const savedReport = ServerDbManager.reportReview(report);
      return NextResponse.json({ success: true, report: savedReport });
    }

    // 1. Validate Transaction & Completion
    const {
      transaction_id,
      order_id,
      order_number,
      reviewer_actor_id,
      reviewer_actor_type = "PERSONAL",
      reviewer_name,
      reviewer_avatar,
      reviewee_actor_id,
      reviewee_actor_type = "PERSONAL",
      reviewee_name,
      reviewer_role,
      overall_rating,
      accuracy_rating,
      timeliness_rating,
      communication_rating,
      quality_rating,
      payment_rating,
      clarity_rating,
      cooperation_rating,
      comment,
      performed_by_user_id,
      transaction_completed_at,
    } = body;

    if (!transaction_id || !reviewer_actor_id || !reviewee_actor_id || !reviewer_role) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc của giao dịch hoặc người đánh giá." },
        { status: 400 }
      );
    }

    if (reviewer_actor_id === reviewee_actor_id) {
      return NextResponse.json(
        { success: false, error: "Không thể tự đánh giá chính mình." },
        { status: 400 }
      );
    }

    // 2. Build and sanitize review payload
    const review = TransactionReviewService.buildReviewPayload({
      transactionId: transaction_id,
      orderId: order_id,
      orderNumber: order_number,
      reviewerActorId: reviewer_actor_id,
      reviewerActorType: reviewer_actor_type,
      reviewerName: reviewer_name,
      reviewerAvatar: reviewer_avatar,
      revieweeActorId: reviewee_actor_id,
      revieweeActorType: reviewee_actor_type,
      revieweeName: reviewee_name,
      reviewerRole: reviewer_role,
      overallRating: overall_rating,
      accuracyRating: accuracy_rating,
      timelinessRating: timeliness_rating,
      communicationRating: communication_rating,
      qualityRating: quality_rating,
      paymentRating: payment_rating,
      clarityRating: clarity_rating,
      cooperationRating: cooperation_rating,
      comment,
      performedByUserId: performed_by_user_id || "usr_default",
      transactionCompletedAt: transaction_completed_at,
    });

    const result = ServerDbManager.upsertReview(review);
    const updatedStats = ServerDbManager.getActorReviewStats(reviewee_actor_id, reviewee_actor_type);

    return NextResponse.json({
      success: true,
      review: result.review,
      isRevealed: result.isRevealed,
      stats: updatedStats,
    });
  } catch (error: any) {
    console.error("Error in POST /api/reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create review" },
      { status: 400 }
    );
  }
}

/**
 * PUT /api/reviews
 * Handle Official Response or Review Update
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, review_id } = body;

    if (action === "RESPOND") {
      const responsePayload: ReviewResponse = {
        id: `res-${Date.now()}`,
        review_id,
        responder_actor_id: body.responder_actor_id,
        responder_name: body.responder_name,
        comment: body.comment,
        performed_by_user_id: body.performed_by_user_id || "usr_default",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = ServerDbManager.respondToReview(review_id, responsePayload);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Không tìm thấy đánh giá" }, { status: 404 });
      }
      return NextResponse.json({ success: true, review: updated });
    }

    if (action === "UPDATE") {
      const all = ServerDbManager.getAllReviews();
      const target = all.find((r) => r.id === review_id);
      if (!target) {
        return NextResponse.json({ success: false, error: "Không tìm thấy đánh giá" }, { status: 404 });
      }

      if (!ReviewEligibilityService.isEditable(target)) {
        return NextResponse.json(
          { success: false, error: "Thời gian chỉnh sửa 24 giờ của đánh giá đã kết thúc." },
          { status: 403 }
        );
      }

      const updatedReview: TransactionReview = {
        ...target,
        overall_rating: body.overall_rating ? TransactionReviewService.validateRating(body.overall_rating, true)! : target.overall_rating,
        comment: body.comment !== undefined ? TransactionReviewService.sanitizeComment(body.comment) : target.comment,
        updated_at: new Date().toISOString(),
      };

      const result = ServerDbManager.upsertReview(updatedReview);
      return NextResponse.json({ success: true, review: result.review });
    }

    return NextResponse.json({ success: false, error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in PUT /api/reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}
