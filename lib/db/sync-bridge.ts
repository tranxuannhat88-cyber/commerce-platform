import { Offer, Store, ActorPaymentAccount, Order } from "@/types";

export class SyncBridgeService {
  /**
   * Đồng bộ một Offer lên máy chủ
   */
  public static async syncOfferToServer(offer: Offer): Promise<boolean> {
    try {
      const res = await fetch("/api/sync/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });
      return res.ok;
    } catch (err) {
      console.warn("Background syncOfferToServer warning:", err);
      return false;
    }
  }

  /**
   * Đồng bộ toàn bộ danh sách Offer lên máy chủ
   */
  public static async syncAllOffersToServer(offers: Offer[]): Promise<boolean> {
    try {
      const res = await fetch("/api/sync/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offers }),
      });
      return res.ok;
    } catch (err) {
      console.warn("Background syncAllOffersToServer warning:", err);
      return false;
    }
  }

  /**
   * Xóa Offer trên máy chủ
   */
  public static async deleteOfferFromServer(offerId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sync/offers?id=${encodeURIComponent(offerId)}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.warn("Background deleteOfferFromServer warning:", err);
      return false;
    }
  }

  /**
   * Đồng bộ Cửa hàng và Danh sách Tài khoản Ngân hàng lên máy chủ
   */
  public static async syncStoreToServer(
    store: Store,
    paymentAccounts?: ActorPaymentAccount[],
    sellerProfile?: {
      actor_id?: string;
      actor_type?: "PERSONAL" | "ORGANIZATION";
      display_name?: string;
      full_name?: string;
      org_name?: string;
      avatar_url?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/sync/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, paymentAccounts, sellerProfile }),
      });
      return res.ok;
    } catch (err) {
      console.warn("Background syncStoreToServer warning:", err);
      return false;
    }
  }

  /**
   * Khách hàng gửi Đơn hàng lên máy chủ (xuyên thiết bị)
   */
  public static async submitOrderToServer(order: Order): Promise<boolean> {
    try {
      const res = await fetch("/api/sync/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      return res.ok;
    } catch (err) {
      console.error("submitOrderToServer error:", err);
      return false;
    }
  }

  /**
   * Người bán kéo (Pull) các đơn hàng mới từ máy chủ
   */
  public static async pullServerOrders(storeId?: string): Promise<Order[]> {
    try {
      const url = storeId ? `/api/sync/orders?store_id=${encodeURIComponent(storeId)}` : "/api/sync/orders";
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.orders || [];
    } catch (err) {
      console.warn("pullServerOrders warning:", err);
      return [];
    }
  }

  /**
   * Đồng bộ Đánh giá giao dịch lên máy chủ
   */
  public static async submitReviewToServer(review: import("@/types").TransactionReview): Promise<{
    success: boolean;
    review?: import("@/types").TransactionReview;
    isRevealed?: boolean;
    stats?: import("@/types").ActorReviewStats;
  }> {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });
      if (!res.ok) return { success: false };
      return await res.json();
    } catch (err) {
      console.warn("Background submitReviewToServer warning:", err);
      return { success: false };
    }
  }

  /**
   * Kéo danh sách Đánh giá từ máy chủ
   */
  public static async pullReviewsFromServer(params: {
    actorId?: string;
    storeSlug?: string;
    currentActorId?: string;
    transactionId?: string;
  }): Promise<{ reviews: import("@/types").TransactionReview[]; stats?: import("@/types").ActorReviewStats }> {
    try {
      const query = new URLSearchParams();
      if (params.actorId) query.set("actor_id", params.actorId);
      if (params.storeSlug) query.set("store_slug", params.storeSlug);
      if (params.currentActorId) query.set("current_actor_id", params.currentActorId);
      if (params.transactionId) query.set("transaction_id", params.transactionId);

      const res = await fetch(`/api/reviews?${query.toString()}`);
      if (!res.ok) return { reviews: [] };
      const data = await res.json();
      return {
        reviews: data.reviews || [],
        stats: data.stats,
      };
    } catch (err) {
      return { reviews: [] };
    }
  }

  /**
   * Gửi phản hồi chính thức cho Đánh giá lên máy chủ
   */
  public static async respondToReviewOnServer(
    reviewId: string,
    responseData: {
      responder_actor_id: string;
      responder_name?: string;
      comment: string;
      performed_by_user_id?: string;
    }
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESPOND", review_id: reviewId, ...responseData }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Gửi Báo cáo vi phạm đánh giá lên máy chủ
   */
  public static async reportReviewToServer(report: import("@/types").ReviewReport): Promise<boolean> {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REPORT_REVIEW", ...report }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }
}
