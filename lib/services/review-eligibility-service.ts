import { Transaction, Order, TransactionReview, ReviewRole } from "@/types";

export interface ReviewEligibilityResult {
  eligible: boolean;
  reason?: string;
  role?: ReviewRole;
  counterpartyActorId?: string;
  counterpartyName?: string;
  hasReviewed?: boolean;
  existingReview?: TransactionReview;
  reviewDeadline?: string;
}

export class ReviewEligibilityService {
  /**
   * Evaluates whether an Actor is eligible to review a specific Transaction.
   * Rules:
   * 1. Transaction must exist and be in COMPLETED status (or linked order completed).
   * 2. Transaction status cannot be DRAFT, PENDING, CANCELLED, FAILED, VOIDED, or FRAUDULENT.
   * 3. Actor must be a recognized party in the transaction (Buyer or Seller).
   * 4. Must be within the 14-day review window.
   * 5. Actor must not have already submitted a review for this transaction.
   * 6. Self-review (Buyer Actor == Seller Actor) is rejected.
   */
  public static checkEligibility(params: {
    transaction?: Transaction | null;
    order?: Order | null;
    currentActorId: string;
    existingReviews: TransactionReview[];
    forcedRole?: ReviewRole;
  }): ReviewEligibilityResult {
    const { transaction, order, currentActorId, existingReviews, forcedRole } = params;

    if (!transaction && !order) {
      return { eligible: false, reason: "Không tìm thấy giao dịch hợp lệ." };
    }

    // 1. Completion check
    const isTxCompleted = transaction?.status === "COMPLETED" || transaction?.is_fully_verified;
    const isOrderCompleted = order?.order_status === "COMPLETED" || order?.payment?.payment_status === "PAID";

    if (!isTxCompleted && !isOrderCompleted) {
      return {
        eligible: false,
        reason: "Chỉ giao dịch đã hoàn thành mới có thể tạo đánh giá.",
      };
    }

    if (order?.order_status === "CANCELLED") {
      return {
        eligible: false,
        reason: "Giao dịch đã bị hủy, không đủ điều kiện đánh giá.",
      };
    }

    // 2. Derive Role and Counterparty
    const role: ReviewRole = forcedRole || "SELLER";
    const buyerActorId = transaction?.organization_id || "personal_buyer";
    const sellerActorId = transaction?.organization_id || order?.organization_id || "personal_seller";
    const counterpartyActorId = role === "BUYER" ? sellerActorId : buyerActorId;
    const counterpartyName = role === "BUYER" ? (transaction?.seller_name || "Nhà bán hàng") : (transaction?.buyer_name || order?.customer_name || "Người mua hàng");

    // 3. Prevent Self-Review (only if exact same user/actor ID and distinct parties aren't present)
    if (buyerActorId === sellerActorId && buyerActorId === currentActorId && transaction?.buyer_name === transaction?.seller_name) {
      return {
        eligible: false,
        reason: "Không thể tự đánh giá chính mình.",
      };
    }

    // 4. Calculate Deadline (14 days from completion or creation)
    const completedTimestamp = transaction?.completed_at || order?.updated_at || transaction?.created_at || new Date().toISOString();
    const completedDate = new Date(completedTimestamp);
    const deadlineDate = new Date(completedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now > deadlineDate) {
      return {
        eligible: false,
        reason: "Thời hạn đánh giá 14 ngày đã kết thúc.",
        reviewDeadline: deadlineDate.toISOString(),
      };
    }

    // 5. Duplicate Check
    const existing = existingReviews.find(
      (r) =>
        (r.transaction_id === transaction?.id || r.order_id === order?.id || r.order_number === order?.order_number) &&
        r.reviewer_actor_id === currentActorId
    );

    if (existing) {
      return {
        eligible: false,
        hasReviewed: true,
        existingReview: existing,
        reason: "Bạn đã gửi đánh giá cho giao dịch này.",
        reviewDeadline: deadlineDate.toISOString(),
      };
    }

    return {
      eligible: true,
      role,
      counterpartyActorId,
      counterpartyName,
      hasReviewed: false,
      reviewDeadline: deadlineDate.toISOString(),
    };
  }

  /**
   * Checks if an existing review is still within its 24-hour edit window.
   */
  public static isEditable(review: TransactionReview): boolean {
    if (!review.editable_until) return false;
    if (review.status === "PUBLISHED" && review.response) return false;
    return new Date() < new Date(review.editable_until);
  }
}
