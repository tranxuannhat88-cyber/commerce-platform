export type AppEnvironment = 'development' | 'preview' | 'public_test' | 'production';

export const DOMAIN_CONFIG = {
  // Primary Public Test / Production Domain Configuration
  PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://app.hinex.vn",
  
  // Environment identifier
  APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment) || "production",
  APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE || "production",
  
  // Future domain migration configuration
  CURRENT_PUBLIC_DOMAIN: "app.hinex.vn",
  CANONICAL_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "app.hinex.vn",
  LEGACY_DOMAINS: ["go.invamax.com"],

  // Brand abstraction (independent of domain name)
  BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || "Hinex - Nền tảng giao dịch số",
  BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Hinex",
  BRAND_TAGLINE: "Nền tảng giao dịch số và thương mại tin cậy",
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@hinex.vn",

  // SEO & Indexing Policy
  PUBLIC_SEARCH_INDEXING: process.env.NEXT_PUBLIC_SEARCH_INDEXING === "true", // Default false for public test

  // Maintenance Flag
  MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
};
