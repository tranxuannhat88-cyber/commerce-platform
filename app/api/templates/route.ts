import { NextRequest, NextResponse } from "next/server";
import { STORE_TEMPLATES } from "@/lib/templates/definitions";

export async function GET(req: NextRequest) {
  try {
    const active = STORE_TEMPLATES.filter((t) => t.status === "ACTIVE");
    return NextResponse.json({
      success: true,
      templates: active,
      total: active.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/templates error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
