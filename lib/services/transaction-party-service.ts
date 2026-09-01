import { TransactionReview, PublicReviewDTO, GuestIdentity } from "@/types";
import { GuestIdentityService } from "./guest-identity-service";

export class TransactionPartyService {
  /**
   * Transforms a TransactionReview into a privacy-safe PublicReviewDTO.
   * Ensures guest internal IDs, phone numbers, and private info are never leaked.
   */
  public static toPublicReviewDTO(
    review: TransactionReview,
    viewerActorId?: string
  ): PublicReviewDTO {
    const isGuest = review.reviewer_party_type === "GUEST" || !!review.reviewer_guest_identity_id;

    let reviewerDisplayName = "Khách hàng đã xác minh";
    if (isGuest) {
      reviewerDisplayName = review.reviewer_name
        ? GuestIdentityService.maskCustomerName(review.reviewer_name)
        : "Khách hàng đã xác minh";
    } else {
      reviewerDisplayName = review.reviewer_name || "Thành viên đã xác minh";
    }

    return {
      id: review.id,
      transaction_id: review.transaction_id,
      order_number: review.order_number,
      overall_rating: review.overall_rating,
      accuracy_rating: review.accuracy_rating,
      timeliness_rating: review.timeliness_rating,
      communication_rating: review.communication_rating,
      quality_rating: review.quality_rating,
      payment_rating: review.payment_rating,
      clarity_rating: review.clarity_rating,
      cooperation_rating: review.cooperation_rating,
      comment: review.comment,
      published_at: review.published_at,
      is_verified_transaction: review.is_verified_transaction ?? true,
      reviewer_display_type: isGuest ? "VERIFIED_GUEST" : "REGISTERED_ACTOR",
      reviewer_display_name: reviewerDisplayName,
      reviewer_actor_id: isGuest ? undefined : (review.reviewer_actor_id || undefined),
      response: review.response,
    };
  }
}
