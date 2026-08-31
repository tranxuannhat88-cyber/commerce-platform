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
  public static async syncStoreToServer(store: Store, paymentAccounts?: ActorPaymentAccount[]): Promise<boolean> {
    try {
      const res = await fetch("/api/sync/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store, paymentAccounts }),
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
}
