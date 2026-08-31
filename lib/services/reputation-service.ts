import { Order, Transaction, ActorReviewStats, TransactionReview } from "@/types";

export interface PublicReputationSummary {
  actor_id: string;
  completed_transactions_count: number;
  published_reviews_count: number;
  overall_rating_avg: number | null;
  accuracy_rating_avg: number | null;
  timeliness_rating_avg: number | null;
  communication_rating_avg: number | null;
  rating_distribution: {
    star_5: number;
    star_4: number;
    star_3: number;
    star_2: number;
    star_1: number;
  };
  has_reputation: boolean;
}

export class ReputationService {
  /**
   * Derives authoritative public reputation summary for an Actor.
   * STRICT PRINCIPLE: Never fabricate numbers. If no reviews, overall_rating_avg is null.
   */
  public static getPublicActorReputation(params: {
    actorId: string;
    orders: Order[];
    transactions: Transaction[];
    reviewStats?: ActorReviewStats | null;
    reviews?: TransactionReview[];
  }): PublicReputationSummary {
    const { actorId, orders, transactions, reviewStats, reviews = [] } = params;

    // Count genuine completed transactions where this actor is the seller
    const completedOrders = orders.filter(
      (o) =>
        (o.store_id === actorId || o.organization_id === actorId) &&
        (o.order_status === "COMPLETED" || o.payment?.payment_status === "PAID")
    ).length;

    const completedTxs = transactions.filter(
      (t) => (t.organization_id === actorId || t.seller_name) && (t.status === "COMPLETED" || t.is_fully_verified)
    ).length;

    const completedCount = Math.max(completedOrders, completedTxs);

    // Published reviews for this actor
    const publishedReviews = reviews.filter(
      (r) => r.reviewee_actor_id === actorId && r.status === "PUBLISHED"
    );

    const reviewCount = reviewStats?.published_reviews_count ?? publishedReviews.length;
    const ratingAvg = reviewStats?.overall_rating_avg ?? (reviewCount > 0 ? publishedReviews.reduce((s, r) => s + r.overall_rating, 0) / reviewCount : null);

    const distribution = reviewStats?.rating_distribution || {
      star_5: publishedReviews.filter((r) => Math.round(r.overall_rating) === 5).length,
      star_4: publishedReviews.filter((r) => Math.round(r.overall_rating) === 4).length,
      star_3: publishedReviews.filter((r) => Math.round(r.overall_rating) === 3).length,
      star_2: publishedReviews.filter((r) => Math.round(r.overall_rating) === 2).length,
      star_1: publishedReviews.filter((r) => Math.round(r.overall_rating) === 1).length,
    };

    return {
      actor_id: actorId,
      completed_transactions_count: completedCount,
      published_reviews_count: reviewCount,
      overall_rating_avg: ratingAvg !== null ? Math.round(ratingAvg * 10) / 10 : null,
      accuracy_rating_avg: reviewStats?.accuracy_rating_avg || null,
      timeliness_rating_avg: reviewStats?.timeliness_rating_avg || null,
      communication_rating_avg: reviewStats?.communication_rating_avg || null,
      rating_distribution: distribution,
      has_reputation: reviewCount > 0 || completedCount > 0,
    };
  }
}
