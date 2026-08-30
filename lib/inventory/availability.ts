import {
  ProductStatus,
  AvailabilityStatus,
  OutOfStockVisibility,
  StoreProductVisibilitySettings,
  OfferVisibilitySettings,
  Offer,
  OfferItem,
  Product,
} from "@/types";

export class ProductAvailabilityService {
  /**
   * Tính toán trạng thái khả dụng tồn kho theo số lượng thực tế
   */
  public static computeAvailability(params: {
    inventory_tracking?: boolean;
    availability_status?: AvailabilityStatus;
    available_quantity?: number;
    low_stock_threshold?: number;
  }): AvailabilityStatus {
    const {
      inventory_tracking,
      availability_status,
      available_quantity = 0,
      low_stock_threshold = 5,
    } = params;

    // Nếu không theo dõi tồn kho (Dịch vụ, sản phẩm số, hoặc manual)
    if (inventory_tracking === false) {
      return availability_status || "IN_STOCK";
    }

    // Tự động tính toán theo số lượng khả dụng
    if (available_quantity <= 0) {
      return "OUT_OF_STOCK";
    }
    if (available_quantity <= low_stock_threshold) {
      return "LOW_STOCK";
    }
    return "IN_STOCK";
  }

  /**
   * Kiểm tra điều kiện hiển thị sản phẩm trong Offer công khai (Bảng giá)
   * Mặc định: ẨN sản phẩm hết hàng để tối ưu conversion (out_of_stock_visibility = 'HIDE')
   */
  public static isOfferItemVisible(
    item: OfferItem | Offer,
    settings?: OfferVisibilitySettings
  ): boolean {
    const productStatus = item.product_status || ((item as Offer).status === "ACTIVE" ? "ACTIVE" : (item.product_status || "ACTIVE"));
    const outOfStockVisibility = settings?.out_of_stock_visibility || "HIDE";

    // 1. Không hiển thị sản phẩm ngừng kinh doanh, tạm ẩn hoặc nháp
    if (productStatus === "DISCONTINUED" || productStatus === "HIDDEN" || productStatus === "DRAFT") {
      return false;
    }

    // 2. Kiểm tra nếu tạm hết hàng
    const availability = this.computeAvailability({
      inventory_tracking: item.inventory_tracking,
      availability_status: item.availability_status,
      available_quantity: item.available_quantity,
    });

    if (availability === "OUT_OF_STOCK") {
      return outOfStockVisibility === "SHOW_DISABLED";
    }

    return true;
  }

  /**
   * Kiểm tra điều kiện hiển thị sản phẩm trên Storefront công khai
   * Mặc định: VẪN HIỂN THỊ sản phẩm hết hàng để bao quát danh mục (show_out_of_stock_products = true)
   */
  public static isStorefrontVisible(
    product: Product | Offer,
    settings?: StoreProductVisibilitySettings
  ): boolean {
    const productStatus = product.product_status || (product as Offer).status || "ACTIVE";
    const showOutOfStock = settings?.show_out_of_stock_products !== false; // default true

    // 1. Tuyệt đối ẩn các sản phẩm ngừng kinh doanh, ẩn, hoặc nháp
    if (productStatus === "DISCONTINUED" || productStatus === "HIDDEN" || productStatus === "DRAFT") {
      return false;
    }

    // 2. Kiểm tra khả dụng
    const availability = this.computeAvailability({
      inventory_tracking: product.inventory_tracking,
      availability_status: product.availability_status,
      available_quantity: product.available_quantity,
      low_stock_threshold: product.low_stock_threshold || settings?.low_stock_threshold,
    });

    if (availability === "OUT_OF_STOCK") {
      return showOutOfStock;
    }

    return true;
  }

  /**
   * Sắp xếp danh mục Storefront ưu tiên: IN_STOCK -> LOW_STOCK -> UNLIMITED -> OUT_OF_STOCK
   */
  public static sortStorefrontProducts<T extends { availability_status?: AvailabilityStatus; available_quantity?: number; inventory_tracking?: boolean }>(
    items: T[]
  ): T[] {
    const getPriority = (item: T): number => {
      const avail = this.computeAvailability({
        inventory_tracking: item.inventory_tracking,
        availability_status: item.availability_status,
        available_quantity: item.available_quantity,
      });

      switch (avail) {
        case "IN_STOCK":
          return 1;
        case "LOW_STOCK":
          return 2;
        case "UNLIMITED":
        case "NOT_APPLICABLE":
          return 3;
        case "OUT_OF_STOCK":
          return 4;
        default:
          return 5;
      }
    };

    return [...items].sort((a, b) => getPriority(a) - getPriority(b));
  }

  /**
   * Kiểm tra khả năng đặt hàng (Purchasability)
   */
  public static isPurchasable(
    item: Product | Offer | OfferItem,
    requestedQty: number = 1
  ): { purchasable: boolean; reason?: string } {
    const productStatus = item.product_status || (item as Offer).status || "ACTIVE";

    if (productStatus === "DISCONTINUED") {
      return { purchasable: false, reason: "Sản phẩm đã ngừng kinh doanh." };
    }
    if (productStatus === "HIDDEN" || productStatus === "DRAFT") {
      return { purchasable: false, reason: "Sản phẩm hiện không khả dụng." };
    }

    const avail = this.computeAvailability({
      inventory_tracking: item.inventory_tracking,
      availability_status: item.availability_status,
      available_quantity: item.available_quantity,
    });

    if (avail === "OUT_OF_STOCK") {
      return { purchasable: false, reason: "Sản phẩm đang tạm hết hàng." };
    }

    if (item.inventory_tracking && item.available_quantity !== undefined) {
      if (requestedQty > item.available_quantity) {
        return {
          purchasable: false,
          reason: `Chỉ còn ${item.available_quantity} sản phẩm trong kho.`,
        };
      }
    }

    return { purchasable: true };
  }
}
