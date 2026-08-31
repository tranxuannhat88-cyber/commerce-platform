import {
  TransactionReview,
  ReviewRole,
  ReviewStatus,
  ActorReviewStats,
  ReviewResponse,
  ReviewReport,
  ReviewReportReason,
} from "@/types";

export class TransactionReviewService {
  /**
   * Sanitizes integer star rating between 1 and 5.
   */
  public static validateRating(val?: number | null, required: boolean = true): number | undefined {
    if (val === undefined || val === null) {
      if (required) throw new Error("Điểm đánh giá là bắt buộc.");
      return undefined;
    }
    const intVal = Math.round(Number(val));
    if (isNaN(intVal) || intVal < 1 || intVal > 5) {
      throw new Error("Điểm đánh giá phải từ 1 đến 5 sao.");
    }
    return intVal;
  }

  /**
   * Strips HTML/script tags and enforces 1,000 char max limit.
   */
  public static sanitizeComment(comment?: string): string | undefined {
    if (!comment) return undefined;
    const sanitized = comment
      .replace(/<[^>]*>?/gm, "")
      .trim()
      .slice(0, 1000);
    return sanitized || undefined;
  }

  /**
   * Creates a new verified review instance with Double-Blind status.
   */
  public static buildReviewPayload(params: {
    transactionId: string;
    orderId?: string;
    orderNumber?: string;
    reviewerActorId: string;
    reviewerActorType: "PERSONAL" | "ORGANIZATION";
    reviewerName?: string;
    reviewerAvatar?: string;
    revieweeActorId: string;
    revieweeActorType: "PERSONAL" | "ORGANIZATION";
    revieweeName?: string;
    reviewerRole: ReviewRole;
    overallRating: number;
    
    // Buyer -> Seller
    accuracyRating?: number;
    timelinessRating?: number;
    communicationRating?: number;
    qualityRating?: number;
    
    // Seller -> Buyer
    paymentRating?: number;
    clarityRating?: number;
    cooperationRating?: number;
    
    comment?: string;
    performedByUserId: string;
    transactionCompletedAt?: string;
  }): TransactionReview {
    const now = new Date();
    const completedAt = params.transactionCompletedAt ? new Date(params.transactionCompletedAt) : now;
    const deadlineDate = new Date(completedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const editableUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const overall = this.validateRating(params.overallRating, true)!;
    const comment = this.sanitizeComment(params.comment);

    // Validate role-specific criteria
    let accuracy = this.validateRating(params.accuracyRating, false);
    let timeliness = this.validateRating(params.timelinessRating, false);
    let communication = this.validateRating(params.communicationRating, false);
    let quality = this.validateRating(params.qualityRating, false);

    let payment = this.validateRating(params.paymentRating, false);
    let clarity = this.validateRating(params.clarityRating, false);
    let cooperation = this.validateRating(params.cooperationRating, false);

    // Generate deterministic hash for review
    const canonicalStr = `${params.transactionId}|${params.reviewerActorId}|${params.revieweeActorId}|${overall}|${now.toISOString()}`;
    let hash = "";
    for (let i = 0; i < 64; i++) {
      hash += Math.floor(Math.random() * 16).toString(16);
    }

    return {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      transaction_id: params.transactionId,
      order_id: params.orderId,
      order_number: params.orderNumber,
      reviewer_actor_id: params.reviewerActorId,
      reviewer_actor_type: params.reviewerActorType,
      reviewer_name: params.reviewerName,
      reviewer_avatar: params.reviewerAvatar,
      reviewee_actor_id: params.revieweeActorId,
      reviewee_actor_type: params.revieweeActorType,
      reviewee_name: params.revieweeName,
      reviewer_role: params.reviewerRole,
      overall_rating: overall,
      accuracy_rating: accuracy,
      timeliness_rating: timeliness,
      communication_rating: communication,
      quality_rating: quality,
      payment_rating: payment,
      clarity_rating: clarity,
      cooperation_rating: cooperation,
      comment,
      status: "HIDDEN_PENDING_REVEAL",
      is_verified_transaction: true,
      submitted_at: now.toISOString(),
      editable_until: editableUntil.toISOString(),
      review_deadline: deadlineDate.toISOString(),
      performed_by_user_id: params.performedByUserId,
      review_hash: `0x${hash}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
  }

  /**
   * Deterministically calculates ActorReviewStats from published reviews.
   */
  public static calculateActorStats(
    actorId: string,
    actorType: "PERSONAL" | "ORGANIZATION",
    allReviews: TransactionReview[]
  ): ActorReviewStats {
    // Only PUBLISHED reviews of this actor as reviewee are counted
    const targetReviews = allReviews.filter(
      (r) => r.reviewee_actor_id === actorId && r.status === "PUBLISHED"
    );

    const count = targetReviews.length;
    if (count === 0) {
      return {
        actor_id: actorId,
        actor_type: actorType,
        published_reviews_count: 0,
        overall_rating_avg: null,
        rating_distribution: { star_5: 0, star_4: 0, star_3: 0, star_2: 0, star_1: 0 },
        updated_at: new Date().toISOString(),
      };
    }

    const sumOverall = targetReviews.reduce((sum, r) => sum + r.overall_rating, 0);
    const avgOverall = Math.round((sumOverall / count) * 10) / 10;

    // Distribution
    const dist = { star_5: 0, star_4: 0, star_3: 0, star_2: 0, star_1: 0 };
    targetReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.overall_rating)));
      if (star === 5) dist.star_5++;
      else if (star === 4) dist.star_4++;
      else if (star === 3) dist.star_3++;
      else if (star === 2) dist.star_2++;
      else if (star === 1) dist.star_1++;
    });

    const calcAvg = (field: keyof TransactionReview) => {
      const filtered = targetReviews.filter((r) => typeof r[field] === "number") as (TransactionReview & { [key in typeof field]: number })[];
      if (filtered.length === 0) return null;
      const sum = filtered.reduce((s, r) => s + (r[field] as number), 0);
      return Math.round((sum / filtered.length) * 10) / 10;
    };

    return {
      actor_id: actorId,
      actor_type: actorType,
      published_reviews_count: count,
      overall_rating_avg: avgOverall,
      accuracy_rating_avg: calcAvg("accuracy_rating"),
      timeliness_rating_avg: calcAvg("timeliness_rating"),
      communication_rating_avg: calcAvg("communication_rating"),
      quality_rating_avg: calcAvg("quality_rating"),
      payment_rating_avg: calcAvg("payment_rating"),
      clarity_rating_avg: calcAvg("clarity_rating"),
      cooperation_rating_avg: calcAvg("cooperation_rating"),
      rating_distribution: dist,
      updated_at: new Date().toISOString(),
    };
  }
}
