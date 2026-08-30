export type AppEnvironment = 'development' | 'preview' | 'public_test' | 'production';

export const DOMAIN_CONFIG = {
  // Primary Public Test / Production Domain Configuration
  PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://go.invamax.com",
  
  // Environment identifier
  APP_ENV: (process.env.NEXT_PUBLIC_APP_ENV as AppEnvironment) || "public_test",
  APP_STAGE: process.env.NEXT_PUBLIC_APP_STAGE || "public_test",
  
  // Future domain migration configuration
  CURRENT_PUBLIC_DOMAIN: "go.invamax.com",
  CANONICAL_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "go.invamax.com",
  LEGACY_DOMAINS: ["go.invamax.com"],

  // Brand abstraction (independent of domain name)
  BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || "Commerce & Transaction Platform",
  BRAND_SHORT_NAME: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Commerce Platform",
  BRAND_TAGLINE: "Nền tảng thương mại, báo giá đa kênh và giao dịch tin cậy",
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@invamax.com",

  // SEO & Indexing Policy
  PUBLIC_SEARCH_INDEXING: process.env.NEXT_PUBLIC_SEARCH_INDEXING === "true", // Default false for public test

  // Maintenance Flag
  MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
};
