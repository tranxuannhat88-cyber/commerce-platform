import { UserIdentity } from "./types";
import { Order, Quotation } from "@/types";

export class ClaimService {
  /**
   * Khách hàng liên kết Đơn hàng vãng lai vào Tài khoản vừa xác minh
   */
  public static claimGuestOrder(
    order: Order,
    user: UserIdentity
  ): {
    success: boolean;
    claimed_order: Order;
    message: string;
  } {
    const updatedOrder: Order = {
      ...order,
      customer_email: order.customer_email || user.primary_email,
    };

    console.log(`[ClaimService] Order ${order.order_number} claimed by user ${user.id} (${user.full_name})`);

    return {
      success: true,
      claimed_order: updatedOrder,
      message: `Đơn hàng ${order.order_number} đã được liên kết thành công vào tài khoản của bạn.`,
    };
  }

  /**
   * Nhà cung cấp liên kết Báo giá vãng lai vào Tài khoản vừa xác minh
   */
  public static claimGuestQuotation(
    quotation: Quotation,
    user: UserIdentity
  ): {
    success: boolean;
    claimed_quotation: Quotation;
    message: string;
  } {
    console.log(`[ClaimService] Quotation ${quotation.id} claimed by seller ${user.id} (${user.full_name})`);

    return {
      success: true,
      claimed_quotation: quotation,
      message: `Báo giá đã được lưu vào Workspace của bạn.`,
    };
  }
}
