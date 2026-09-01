import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { ServerDbManager } from "@/lib/server/db";
import { formatVND, slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeSlug = searchParams.get("store_slug") || "";
    const offerSlug = searchParams.get("offer_slug") || "";
    const directTitle = searchParams.get("title") || "";
    const directPrice = searchParams.get("price") || "";

    const offer = offerSlug ? ServerDbManager.getOfferBySlug(storeSlug, offerSlug) : null;
    const store = storeSlug ? ServerDbManager.getStoreBySlug(storeSlug) : null;

    // 1. Check if offer has an image (Prioritize product item image, then custom banner, then store logo)
    const rawImage = offer?.items?.[0]?.image_url || offer?.image_url || store?.logo_url;

    if (rawImage && rawImage.startsWith("data:image/")) {
      const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");

        return new Response(buffer, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600",
          },
        });
      }
    }

    // 2. If it's a local public file path (/uploads/...)
    if (rawImage && rawImage.startsWith("/")) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", rawImage);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          return new Response(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          });
        }
      } catch (e) {
        console.warn("Local image read error in OG route:", e);
      }
    }

    // 3. If it's an external HTTP URL, proxy it directly so crawlers (Zalo, FB) receive binary bytes (not 307 redirect)
    if (rawImage && rawImage.startsWith("http")) {
      try {
        const fetched = await fetch(rawImage);
        if (fetched.ok) {
          const contentType = fetched.headers.get("content-type") || "image/jpeg";
          const arrayBuffer = await fetched.arrayBuffer();
          return new Response(arrayBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, s-maxage=86400",
            },
          });
        }
      } catch (e) {
        console.warn("Proxy fetch image error:", e);
      }
    }

    // 3. Dynamic Visual Card (1200 x 630 px) for Social Previews
    const displayTitle = offer?.name || directTitle || (offerSlug ? offerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Ưu Đãi Đặc Biệt");
    const displayStore = store?.store_name || "Invamax Workspace";
    const displayPrice = offer ? formatVND(offer.price) : directPrice ? formatVND(Number(directPrice) || 0) : "";
    const itemCount = offer?.items?.length || 1;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "60px 70px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              🛍️
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "26px", fontWeight: "bold", color: "#60a5fa" }}>
                Go • Nền tảng giao dịch trực tuyến
              </span>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                {displayStore} • Báo giá & Đặt hàng trực tiếp
              </span>
            </div>
          </div>

          {/* Body Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "950px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: "30px",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#60a5fa",
                fontSize: "16px",
                fontWeight: "bold",
                width: "fit-content",
              }}
            >
              {itemCount > 1 ? `📋 BẢNG GIÁ (${itemCount} SẢN PHẨM)` : "📦 SẢN PHẨM ƯU ĐÃI"}
            </div>

            <div
              style={{
                fontSize: "52px",
                fontWeight: "900",
                lineHeight: "1.15",
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              {displayTitle}
            </div>
          </div>

          {/* Footer Price & Verification */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(148, 163, 184, 0.2)",
              paddingTop: "28px",
            }}
          >
            {displayPrice ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" }}>
                  Giá ưu đãi:
                </span>
                <span style={{ fontSize: "40px", fontWeight: "900", color: "#f43f5e" }}>
                  {displayPrice}
                </span>
              </div>
            ) : (
              <div />
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "12px 24px",
                borderRadius: "16px",
                color: "#34d399",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              <span>🛡️ Giao dịch xác thực & Thanh toán VietQR</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    console.error("GET /api/og/offer error:", err);
    return new Response("Error generating OpenGraph image", { status: 500 });
  }
}
