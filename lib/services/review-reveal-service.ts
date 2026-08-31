import { TransactionReview } from "@/types";

export class ReviewRevealService {
  /**
   * Evaluates all reviews for a transaction to determine if they should be revealed.
   * Condition 1: Both Buyer and Seller have submitted reviews for the transaction.
   * Condition 2: The review_deadline (14 days) has passed for a submitted review.
   */
  public static processDoubleBlindReveal(reviews: TransactionReview[]): {
    updatedReviews: TransactionReview[];
    newlyPublishedCount: number;
  } {
    const now = new Date();
    let newlyPublishedCount = 0;

    // Group reviews by transaction_id
    const byTx: Record<string, TransactionReview[]> = {};
    reviews.forEach((r) => {
      if (!byTx[r.transaction_id]) byTx[r.transaction_id] = [];
      byTx[r.transaction_id].push(r);
    });

    const updatedReviews = reviews.map((review) => {
      if (review.status !== "HIDDEN_PENDING_REVEAL") {
        return review;
      }

      const txList = byTx[review.transaction_id] || [];
      const hasBuyer = txList.some((r) => r.reviewer_role === "BUYER" && r.status !== "DRAFT");
      const hasSeller = txList.some((r) => r.reviewer_role === "SELLER" && r.status !== "DRAFT");
      const bothSubmitted = hasBuyer && hasSeller;

      const deadlinePassed = review.review_deadline ? now > new Date(review.review_deadline) : false;

      if (bothSubmitted || deadlinePassed) {
        newlyPublishedCount++;
        return {
          ...review,
          status: "PUBLISHED" as const,
          published_at: review.published_at || now.toISOString(),
          updated_at: now.toISOString(),
        };
      }

      return review;
    });

    return { updatedReviews, newlyPublishedCount };
  }

  /**
   * Filters reviews for client API response according to Double-Blind security rules:
   * 1. If review is PUBLISHED, anyone with access can view it.
   * 2. If review is HIDDEN_PENDING_REVEAL, only the original reviewer actor can view it.
   * Counterparty CANNOT view rating, comment, or criteria.
   */
  public static sanitizeReviewsForActor(
    reviews: TransactionReview[],
    currentActorId?: string
  ): TransactionReview[] {
    return reviews.filter((r) => {
      if (r.status === "PUBLISHED") return true;
      if (r.status === "HIDDEN_PENDING_REVEAL" && currentActorId && r.reviewer_actor_id === currentActorId) {
        return true;
      }
      return false;
    });
  }
}
