import {
  GuestIdentity,
  Order,
  Transaction,
  TransactionReview,
  ActorPaymentAccount,
} from "@/types";
import { cleanPhoneNumber } from "@/lib/utils";

export interface ClaimableGuestSummary {
  guest_identities: GuestIdentity[];
  claimable_orders: Order[];
  claimable_transactions: Transaction[];
  claimable_reviews_given: TransactionReview[];
  claimable_reviews_received: TransactionReview[];
  total_orders_count: number;
  total_transactions_count: number;
}

export class GuestClaimService {
  /**
   * Finds all unclaimed guest records matching a verified phone number.
   */
  public static findClaimableHistory(params: {
    verifiedPhone: string;
    guestIdentities: GuestIdentity[];
    orders: Order[];
    transactions: Transaction[];
    reviews: TransactionReview[];
    currentActorId?: string;
  }): ClaimableGuestSummary {
    const cleaned = cleanPhoneNumber(params.verifiedPhone);
    if (!cleaned) {
      return {
        guest_identities: [],
        claimable_orders: [],
        claimable_transactions: [],
        claimable_reviews_given: [],
        claimable_reviews_received: [],
        total_orders_count: 0,
        total_transactions_count: 0,
      };
    }

    // 1. Unclaimed guest identities
    const matchedGuests = params.guestIdentities.filter(
      (g) => g.verified_phone === cleaned && (!g.claimed_by_actor_id || g.claimed_by_actor_id === params.currentActorId)
    );
    const guestIds = new Set(matchedGuests.map((g) => g.id));

    // 2. Orders matching phone or guest identity
    const matchedOrders = params.orders.filter(
      (o) =>
        (cleanPhoneNumber(o.customer_phone) === cleaned || (o.buyer_guest_identity_id && guestIds.has(o.buyer_guest_identity_id))) &&
        (!o.claimed_by_actor_id || o.claimed_by_actor_id === params.currentActorId)
    );

    // 3. Transactions matching guest identity or linked order numbers
    const orderNumbers = new Set(matchedOrders.map((o) => o.order_number));
    const matchedTransactions = params.transactions.filter(
      (t) =>
        (t.buyer_guest_identity_id && guestIds.has(t.buyer_guest_identity_id)) ||
        (t.order_number && orderNumbers.has(t.order_number))
    );

    // 4. Reviews given by or received for this guest identity
    const reviewsGiven = params.reviews.filter(
      (r) => r.reviewer_guest_identity_id && guestIds.has(r.reviewer_guest_identity_id)
    );
    const reviewsReceived = params.reviews.filter(
      (r) => r.reviewee_guest_identity_id && guestIds.has(r.reviewee_guest_identity_id)
    );

    return {
      guest_identities: matchedGuests,
      claimable_orders: matchedOrders,
      claimable_transactions: matchedTransactions,
      claimable_reviews_given: reviewsGiven,
      claimable_reviews_received: reviewsReceived,
      total_orders_count: matchedOrders.length,
      total_transactions_count: matchedTransactions.length,
    };
  }

  /**
   * Executes Claim without duplicating rows (Link, Do Not Copy).
   */
  public static applyClaim(params: {
    actorId: string;
    verifiedPhone: string;
    guestIdentities: GuestIdentity[];
    orders: Order[];
    transactions: Transaction[];
  }): {
    updatedGuestIdentities: GuestIdentity[];
    updatedOrders: Order[];
    updatedTransactions: Transaction[];
    claimedCount: number;
  } {
    const cleaned = cleanPhoneNumber(params.verifiedPhone);
    const now = new Date().toISOString();
    let claimedCount = 0;

    // 1. Update guest identities
    const updatedGuestIdentities = params.guestIdentities.map((g) => {
      if (g.verified_phone === cleaned && !g.claimed_by_actor_id) {
        claimedCount++;
        return {
          ...g,
          status: "CLAIMED" as const,
          claimed_by_actor_id: params.actorId,
          claimed_at: now,
          updated_at: now,
        };
      }
      return g;
    });

    const claimedGuestIds = new Set(
      updatedGuestIdentities.filter((g) => g.claimed_by_actor_id === params.actorId).map((g) => g.id)
    );

    // 2. Link orders
    const updatedOrders = params.orders.map((o) => {
      if (
        (cleanPhoneNumber(o.customer_phone) === cleaned || (o.buyer_guest_identity_id && claimedGuestIds.has(o.buyer_guest_identity_id))) &&
        !o.claimed_by_actor_id
      ) {
        return {
          ...o,
          claimed_by_actor_id: params.actorId,
          updated_at: now,
        };
      }
      return o;
    });

    // 3. Link transactions
    const updatedTransactions = params.transactions.map((t) => {
      if (
        (t.buyer_guest_identity_id && claimedGuestIds.has(t.buyer_guest_identity_id)) &&
        !t.claimed_by_actor_id
      ) {
        return {
          ...t,
          claimed_by_actor_id: params.actorId,
        };
      }
      return t;
    });

    return {
      updatedGuestIdentities,
      updatedOrders,
      updatedTransactions,
      claimedCount,
    };
  }
}
