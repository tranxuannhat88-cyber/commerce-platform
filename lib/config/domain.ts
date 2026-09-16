export type AppEnvironment = 'development' | 'preview' | 'public_test' | 'production';

// Sanitize configured domain to strictly forbid deprecated invamax domain
const resolvePublicAppUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !envUrl.includes("invamax.com")) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://app.hinex.vn";
};

export const DOMAIN_CONFIG = {
  // Primary Public Production Domain Configuration (Canonical: https://app.hinex.vn)
  PUBLIC_APP_URL: resolvePublicAppUrl(),
  
  // Environment identifier
  APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment) || "production",
  APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE || "production",
  
  // Canonical public domain
  CURRENT_PUBLIC_DOMAIN: "app.hinex.vn",
  CANONICAL_PUBLIC_DOMAIN: "app.hinex.vn",
  LEGACY_DOMAINS: ["go.invamax.com"],

  // Brand abstraction (independent of domain name)
  BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || "HINEX - Nền tảng giao dịch số",
  BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "HINEX",
  BRAND_TAGLINE: "Nền tảng giao dịch số và thương mại tin cậy",
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@hinex.vn",

  // SEO & Indexing Policy
  PUBLIC_SEARCH_INDEXING: process.env.NEXT_PUBLIC_SEARCH_INDEXING === "true", // Default false for public test

  // Maintenance Flag
  MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
};
