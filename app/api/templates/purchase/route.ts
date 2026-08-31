import { NextRequest, NextResponse } from "next/server";
import { ServerDbManager } from "@/lib/server/db";
import { TemplateLicense } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const license: TemplateLicense = body?.license;

    if (!license || !license.actor_id || !license.template_id) {
      return NextResponse.json({ success: false, error: "Missing license data" }, { status: 400 });
    }

    const saved = ServerDbManager.upsertTemplateLicense(license);

    return NextResponse.json({
      success: true,
      license: saved,
      message: "Template license recorded successfully",
    });
  } catch (err: unknown) {
    console.error("POST /api/templates/purchase error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actorId = searchParams.get("actor_id");

    const licenses = ServerDbManager.getTemplateLicenses(actorId || undefined);

    return NextResponse.json({
      success: true,
      licenses,
    });
  } catch (err: unknown) {
    console.error("GET /api/templates/purchase error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
