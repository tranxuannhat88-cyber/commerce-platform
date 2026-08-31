import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { STORE_TEMPLATES } from "@/lib/templates/definitions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, templateId, actorId } = body;

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Missing templateId" }, { status: 400 });
    }

    const template = STORE_TEMPLATES.find((t) => t.id === templateId || t.code === templateId);
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    // Check entitlement if paid
    if (template.pricing_type === "PAID") {
      const hasLicense = ServerDbManager.hasActiveLicense(actorId, template.id) || ServerDbManager.hasActiveLicense(actorId, template.code);
      if (!hasLicense) {
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED_TEMPLATE_PURCHASE_REQUIRED",
            message: `Actor ${actorId} does not own active license for template ${template.name}`,
          },
          { status: 403 }
        );
      }
    }

    // Update store
    if (storeId) {
      const store = ServerDbManager.getStoreBySlug(storeId);
      if (store) {
        store.active_template_id = template.id;
        store.template_version = template.version;
        ServerDbManager.upsertStore(store);
      }
    }

    return NextResponse.json({
      success: true,
      appliedTemplate: template,
      message: `Template ${template.name} applied successfully.`,
    });
  } catch (err: unknown) {
    console.error("POST /api/templates/apply error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
