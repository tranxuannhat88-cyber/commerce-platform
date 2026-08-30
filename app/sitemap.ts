import { MetadataRoute } from "next";
import { DOMAIN_CONFIG } from "@/lib/config/domain";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = DOMAIN_CONFIG.PUBLIC_APP_URL.replace(/\/+$/, "");

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/offline`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
