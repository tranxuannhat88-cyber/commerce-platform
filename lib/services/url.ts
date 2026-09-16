import { DOMAIN_CONFIG } from "@/lib/config/domain";

export class AppUrlService {
  /**
   * Lấy Base URL chuẩn hóa của ứng dụng
   * Single Source of Truth - Luôn đảm bảo domain https://app.hinex.vn
   * Tuyệt đối không để rò rỉ domain cũ go.invamax.com
   */
  public static getBaseUrl(): string {
    if (typeof window !== "undefined") {
      // Nếu đang chạy trên localhost / dev port thì dùng origin local để test
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return window.location.origin;
      }
      // Nếu origin hiện tại chứa invamax, bắt buộc ghi đè về https://app.hinex.vn
      if (window.location.origin.includes("invamax.com")) {
        return "https://app.hinex.vn";
      }
      if (window.location.hostname.endsWith("hinex.vn")) {
        return window.location.origin;
      }
    }

    const configured = (DOMAIN_CONFIG.PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
    if (!configured || configured.includes("invamax.com")) {
      return "https://app.hinex.vn";
    }
    return configured;
  }

  /**
   * Tạo Storefront URL Chuẩn Canonical
   * Ví dụ: https://app.hinex.vn/s/invamax-workspace
   */
  public static getPublicStoreUrl(storeSlug?: string): string {
    const base = this.getBaseUrl();
    const cleanSlug = (storeSlug && storeSlug.trim())
      ? storeSlug.trim().replace(/^\/+|\/+$/g, "")
      : "invamax-workspace";
    return `${base}/s/${cleanSlug}`;
  }

  /**
   * Alias tương thích ngược
   */
  public static getStoreUrl(storeSlug?: string): string {
    return this.getPublicStoreUrl(storeSlug);
  }

  /**
   * Tạo Offer / Bảng Giá Public URL chuẩn
   * Ví dụ: https://app.hinex.vn/auto/o/tu-trang-tri
   */
  public static getPublicOfferUrl(storeSlug?: string, offerSlug?: string): string {
    const base = this.getBaseUrl();
    const cleanStore = (storeSlug && storeSlug.trim()) ? storeSlug.trim().replace(/^\/+|\/+$/g, "") : "auto";
    const cleanOffer = (offerSlug && offerSlug.trim()) ? offerSlug.trim().replace(/^\/+|\/+$/g, "") : "offer";
    return `${base}/${cleanStore}/o/${cleanOffer}`;
  }

  public static getOfferUrl(storeSlug?: string, offerSlug?: string): string {
    return this.getPublicOfferUrl(storeSlug, offerSlug);
  }

  /**
   * Tạo Short Offer URL (Dành cho Zalo / SMS / QR Code gọn)
   * Ví dụ: https://app.hinex.vn/o/tu-trang-tri
   */
  public static getShortOfferUrl(offerSlug?: string): string {
    const base = this.getBaseUrl();
    const cleanOffer = (offerSlug && offerSlug.trim()) ? offerSlug.trim().replace(/^\/+|\/+$/g, "") : "offer";
    return `${base}/o/${cleanOffer}`;
  }

  /**
   * Tạo Public Request / RFQ URL
   * Ví dụ: https://app.hinex.vn/r/RQ260830123
   */
  public static getRequestUrl(requestNumberOrId: string): string {
    const base = this.getBaseUrl();
    const cleanReq = requestNumberOrId.trim().replace(/^\/+/, "");
    return `${base}/r/${cleanReq}`;
  }

  /**
   * Tạo Public Quotation URL
   * Ví dụ: https://app.hinex.vn/q/QT260830456
   */
  public static getQuotationUrl(quotationNumberOrId: string): string {
    const base = this.getBaseUrl();
    const cleanQuote = quotationNumberOrId.trim().replace(/^\/+/, "");
    return `${base}/q/${cleanQuote}`;
  }

  /**
   * Tạo Order Tracking URL
   * Ví dụ: https://app.hinex.vn/2k-store/order/ORD-2026-0830-1
   */
  public static getOrderUrl(storeSlug: string, orderNumber: string): string {
    const base = this.getBaseUrl();
    const cleanStore = storeSlug.trim().replace(/^\/+/, "");
    const cleanOrder = orderNumber.trim().replace(/^\/+/, "");
    return `${base}/${cleanStore}/order/${cleanOrder}`;
  }

  /**
   * Tạo Transaction / Document Verification URL (Chứng thực mã hóa)
   * Ví dụ: https://app.hinex.vn/transaction/tx-123/verify
   */
  public static getTransactionVerifyUrl(transactionId: string): string {
    const base = this.getBaseUrl();
    const cleanTx = transactionId.trim().replace(/^\/+/, "");
    return `${base}/transaction/${cleanTx}/verify`;
  }

  /**
   * Tạo Payment Webhook URL cho cổng thanh toán
   * Ví dụ: https://app.hinex.vn/api/payments/webhook/vietqr
   */
  public static getPaymentWebhookUrl(provider: string): string {
    const base = this.getBaseUrl();
    return `${base}/api/payments/webhook/${provider.toLowerCase()}`;
  }

  /**
   * Tạo Payment Return / Result URL
   */
  public static getPaymentReturnUrl(): string {
    const base = this.getBaseUrl();
    return `${base}/payment/result`;
  }
}
