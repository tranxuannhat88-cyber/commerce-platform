import { MetadataRoute } from "next";
import { DOMAIN_CONFIG } from "@/lib/config/domain";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = DOMAIN_CONFIG.PUBLIC_SEARCH_INDEXING;

  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: [
          "/sell/",
          "/buy/",
          "/inventory/",
          "/finance/",
          "/settings/",
          "/store/",
          "/transactions/",
          "/transaction/",
          "/api/",
          "/auth/",
        ],
        allow: ["/_next/", "/icons/", "/manifest.webmanifest", "/favicon.ico"],
      },
      sitemap: `${DOMAIN_CONFIG.PUBLIC_APP_URL}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/sell/",
        "/buy/",
        "/inventory/",
        "/finance/",
        "/settings/",
        "/api/",
      ],
    },
    sitemap: `${DOMAIN_CONFIG.PUBLIC_APP_URL}/sitemap.xml`,
  };
}
