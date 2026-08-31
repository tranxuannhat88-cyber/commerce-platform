import { StoreTemplate, TemplateLicense } from "@/types";
import { STORE_TEMPLATES, DEFAULT_TEMPLATE_ID } from "./definitions";

export class TemplateEntitlementService {
  /**
   * Lấy danh sách toàn bộ mẫu đang kích hoạt (ACTIVE)
   */
  public static getActiveTemplates(): StoreTemplate[] {
    return STORE_TEMPLATES.filter((t) => t.status === "ACTIVE");
  }

  /**
   * Lấy chi tiết mẫu theo ID hoặc Code
   */
  public static getTemplateByIdOrCode(templateIdOrCode?: string): StoreTemplate {
    if (!templateIdOrCode) {
      return STORE_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) || STORE_TEMPLATES[0];
    }
    const clean = templateIdOrCode.trim().toLowerCase();
    const found = STORE_TEMPLATES.find(
      (t) => t.id.toLowerCase() === clean || t.code.toLowerCase() === clean
    );
    return found || STORE_TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) || STORE_TEMPLATES[0];
  }

  /**
   * Kiểm tra quyền sở hữu / áp dụng mẫu cho một Actor
   * - FREE: Luôn luôn được phép (ALLOW)
   * - PAID: Bắt buộc phải có TemplateLicense ACTIVE thuộc về actorId tương ứng
   */
  public static isTemplateOwnedByActor(params: {
    template: StoreTemplate;
    actorId?: string;
    licenses: TemplateLicense[];
  }): boolean {
    const { template, actorId, licenses } = params;

    // 1. Mẫu miễn phí thì bất kỳ ai cũng sở hữu vĩnh viễn
    if (template.pricing_type === "FREE" || template.price === 0) {
      return true;
    }

    // 2. Mẫu trả phí: Yêu cầu License ACTIVE thuộc về đúng actorId
    if (!actorId) return false;

    const hasActiveLicense = licenses.some(
      (lic) =>
        lic.actor_id === actorId &&
        (lic.template_id === template.id || lic.template_code === template.code) &&
        lic.status === "ACTIVE"
    );

    return hasActiveLicense;
  }

  /**
   * Kiểm tra quyền thanh toán / mua mẫu cho Organization
   * - Owner / Admin có quyền quản lý tài chính
   */
  public static canActorPurchaseTemplate(params: {
    actorType: "PERSONAL" | "ORGANIZATION";
    userRole?: string;
  }): boolean {
    const { actorType, userRole } = params;
    if (actorType === "PERSONAL") return true;
    return userRole === "OWNER" || userRole === "ADMIN";
  }
}
