import { NextResponse } from "next/server";
import { DOMAIN_CONFIG } from "@/lib/config/domain";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app_env: DOMAIN_CONFIG.APP_ENV,
    app_stage: DOMAIN_CONFIG.APP_STAGE,
    canonical_domain: DOMAIN_CONFIG.CANONICAL_PUBLIC_DOMAIN,
    version: "1.2.0",
    maintenance_mode: DOMAIN_CONFIG.MAINTENANCE_MODE,
    search_indexing: DOMAIN_CONFIG.PUBLIC_SEARCH_INDEXING,
    timestamp: new Date().toISOString(),
  });
}
