import {
  BillingPlanCode,
  MetricType,
  Subscription,
  UsageMetrics,
  SmartUpgradeRecommendation,
} from "./types";
import { BILLING_PLANS } from "./plans-config";
import { BILLING_ADDONS } from "./addons-config";

export class EntitlementService {
  /**
   * Calculate Effective Limits: Base Plan Limits + All Active Add-ons
   */
  public static getEffectiveLimits(subscription: Subscription): {
    transactions_monthly: number | null;
    active_products: number | null;
    storage_bytes: number | null;
    users: number | null;
    stores: number | null;
  } {
    const basePlan = BILLING_PLANS[subscription.plan_code] || BILLING_PLANS.FREE;
    const baseLimits = { ...basePlan.limits };

    // If Enterprise or already null (unlimited), keep null
    let tx = baseLimits.transactions_monthly;
    let prod = baseLimits.active_products;
    let storage = baseLimits.storage_bytes;
    let users = baseLimits.users;
    let stores = baseLimits.stores;

    // Accumulate active add-ons
    subscription.items.forEach((item) => {
      if (item.item_type === "ADDON" && item.addon_code) {
        const addon = BILLING_ADDONS.find((a) => a.code === item.addon_code);
        if (addon) {
          const totalInc = addon.increment_value * (item.quantity || 1);
          if (addon.metric === "TRANSACTIONS" && tx !== null) {
            tx += totalInc;
          } else if (addon.metric === "ACTIVE_PRODUCTS" && prod !== null) {
            prod += totalInc;
          } else if (addon.metric === "STORAGE_GB" && storage !== null) {
            storage += totalInc * 1024 * 1024 * 1024; // Convert GB to Bytes
          } else if (addon.metric === "USERS" && users !== null) {
            users += totalInc;
          } else if (addon.metric === "STORES" && stores !== null) {
            stores += totalInc;
          }
        }
      }
    });

    return {
      transactions_monthly: tx,
      active_products: prod,
      storage_bytes: storage,
      users,
      stores,
    };
  }

  /**
   * Get realtime usage statistics
   */
  public static getUsage(
    subscription: Subscription,
    confirmedOrdersCount: number = 0,
    activeProductsCount: number = 0,
    actualStorageBytes: number = 0,
    teamMembersCount: number = 1,
    storesCount: number = 1
  ): UsageMetrics {
    const effective = this.getEffectiveLimits(subscription);

    return {
      transactions_used: confirmedOrdersCount,
      transactions_limit: effective.transactions_monthly,
      products_used: activeProductsCount,
      products_limit: effective.active_products,
      storage_bytes_used: actualStorageBytes,
      storage_bytes_limit: effective.storage_bytes,
      users_used: teamMembersCount,
      users_limit: effective.users,
      stores_used: storesCount,
      stores_limit: effective.stores,
    };
  }

  /**
   * Check if user can publish another active product
   */
  public static canPublishProduct(
    subscription: Subscription,
    currentActiveProducts: number
  ): { allowed: boolean; reason?: string } {
    const limits = this.getEffectiveLimits(subscription);
    if (limits.active_products === null) return { allowed: true };

    if (currentActiveProducts >= limits.active_products) {
      return {
        allowed: false,
        reason: `Bạn đã đạt giới hạn ${limits.active_products} sản phẩm hoạt động của gói ${subscription.plan_code}. Vui lòng mua thêm Add-on hoặc nâng gói để xuất bản thêm sản phẩm.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if file upload is within storage quota
   */
  public static canUploadFile(
    subscription: Subscription,
    currentBytes: number,
    uploadBytes: number,
    isCriticalTransactionEvidence: boolean = false
  ): { allowed: boolean; reason?: string } {
    // Critical transaction evidence (VietQR slips, shipping receipts) is always permitted
    if (isCriticalTransactionEvidence) return { allowed: true };

    const limits = this.getEffectiveLimits(subscription);
    if (limits.storage_bytes === null) return { allowed: true };

    if (currentBytes + uploadBytes > limits.storage_bytes) {
      return {
        allowed: false,
        reason: `Dung lượng lưu trữ sẽ vượt quá hạn mức ${this.formatBytes(
          limits.storage_bytes
        )}. Vui lòng nâng cấp dung lượng lưu trữ để tiếp tục tải lên.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check transaction quota status (Never blocks checkout!)
   */
  public static checkTransactionOverage(
    subscription: Subscription,
    currentTransactions: number
  ): { is_over_limit: boolean; percent: number; message?: string } {
    const limits = this.getEffectiveLimits(subscription);
    if (limits.transactions_monthly === null) return { is_over_limit: false, percent: 0 };

    const percent = Math.round((currentTransactions / limits.transactions_monthly) * 100);
    const is_over = currentTransactions >= limits.transactions_monthly;

    return {
      is_over_limit: is_over,
      percent,
      message: is_over
        ? `Workspace đã đạt ${currentTransactions}/${limits.transactions_monthly} giao dịch trong tháng. Khách hàng vẫn có thể tiếp tục đặt hàng bình thường, bạn có thể mua thêm Add-on giao dịch bất kỳ lúc nào.`
        : undefined,
    };
  }

  /**
   * Color coding for Usage Bar based on percentage
   */
  public static getUsageStatus(used: number, limit: number | null): {
    percent: number;
    color: "emerald" | "blue" | "amber" | "rose";
    badgeText: string;
    bgClass: string;
    textClass: string;
    barClass: string;
  } {
    if (limit === null || limit <= 0) {
      return {
        percent: 0,
        color: "emerald",
        badgeText: "Không giới hạn",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        textClass: "text-emerald-700 dark:text-emerald-300",
        barClass: "bg-emerald-500",
      };
    }

    const percent = Math.min(Math.round((used / limit) * 100), 100);

    if (percent < 70) {
      return {
        percent,
        color: "emerald",
        badgeText: "Bình thường",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
        textClass: "text-emerald-700 dark:text-emerald-300",
        barClass: "bg-emerald-500",
      };
    }

    if (percent < 80) {
      return {
        percent,
        color: "blue",
        badgeText: "Đang tăng",
        bgClass: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        textClass: "text-blue-700 dark:text-blue-300",
        barClass: "bg-blue-500",
      };
    }

    if (percent < 100) {
      return {
        percent,
        color: "amber",
        badgeText: "Sắp đầy (≥80%)",
        bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        textClass: "text-amber-700 dark:text-amber-300",
        barClass: "bg-amber-500",
      };
    }

    return {
      percent: 100,
      color: "rose",
      badgeText: "Đạt hạn mức (100%)",
      bgClass: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
      textClass: "text-rose-700 dark:text-rose-300",
      barClass: "bg-rose-500",
    };
  }

  /**
   * Smart Upgrade: Compare current subscription + selected add-ons vs Next Plan
   */
  public static calculateSmartUpgrade(
    currentPlanCode: BillingPlanCode,
    selectedAddonCodes: string[]
  ): SmartUpgradeRecommendation {
    const currentBasePrice =
      BILLING_PLANS[currentPlanCode]?.prices.MONTHLY.amount || 0;

    const addonsCost = selectedAddonCodes.reduce((sum, code) => {
      const addon = BILLING_ADDONS.find((a) => a.code === code);
      return sum + (addon?.price || 0);
    }, 0);

    const totalCurrentMonthly = currentBasePrice + addonsCost;

    if (currentPlanCode === "FREE" || currentPlanCode === "STARTER") {
      const proMonthlyPrice = BILLING_PLANS.PRO.prices.MONTHLY.amount; // 249.000đ

      if (totalCurrentMonthly > proMonthlyPrice) {
        return {
          should_upgrade: true,
          current_total_monthly: totalCurrentMonthly,
          recommended_plan_code: "PRO",
          recommended_plan_monthly_price: proMonthlyPrice,
          monthly_savings: totalCurrentMonthly - proMonthlyPrice,
          additional_benefits: [
            "1.500 giao dịch/tháng (gấp nhiều lần mua lẻ)",
            "2.000 sản phẩm niêm yết công khai",
            "15 GB lưu trữ tốc độ cao",
            "5 tài khoản nhân viên phân quyền",
            "3 cửa hàng trực tuyến độc lập",
            "Xác thực giao dịch & Báo cáo tài chính nâng cao",
          ],
        };
      }
    }

    if (currentPlanCode === "PRO") {
      const bizMonthlyPrice = BILLING_PLANS.BUSINESS.prices.MONTHLY.amount; // 499.000đ
      if (totalCurrentMonthly > bizMonthlyPrice) {
        return {
          should_upgrade: true,
          current_total_monthly: totalCurrentMonthly,
          recommended_plan_code: "BUSINESS",
          recommended_plan_monthly_price: bizMonthlyPrice,
          monthly_savings: totalCurrentMonthly - bizMonthlyPrice,
          additional_benefits: [
            "5.000 giao dịch/tháng",
            "10.000 sản phẩm & 50 GB lưu trữ",
            "15 tài khoản & 10 cửa hàng Storefront",
            "Kết nối API & Hỗ trợ chuyên trách 24/7",
          ],
        };
      }
    }

    return {
      should_upgrade: false,
      current_total_monthly: totalCurrentMonthly,
      recommended_plan_code: currentPlanCode,
      recommended_plan_monthly_price: currentBasePrice,
      monthly_savings: 0,
      additional_benefits: [],
    };
  }

  public static formatBytes(bytes: number | null): string {
    if (bytes === null) return "Không giới hạn";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
