import { DOMAIN_CONFIG } from "./domain";

export const PWA_CONFIG = {
  APP_NAME: DOMAIN_CONFIG.BRAND_NAME,
  APP_SHORT_NAME: DOMAIN_CONFIG.BRAND_SHORT_NAME,
  APP_DESCRIPTION: DOMAIN_CONFIG.BRAND_TAGLINE,
  APP_THEME_COLOR: "#2563eb", // Blue-600
  APP_BACKGROUND_COLOR: "#0f172a", // Slate-900
  PUBLIC_APP_URL: DOMAIN_CONFIG.PUBLIC_APP_URL,
  PWA_START_URL: "/",
  VERSION: "1.2.0",

  // Install Eligibility Thresholds (Value First Principle)
  INSTALL_MIN_SESSIONS: 1,
  INSTALL_MIN_TRANSACTIONS: 0,
  INSTALL_COOLDOWN_DAYS: 7,

  // Storage Keys
  STORAGE_KEYS: {
    INSTALL_DISMISSED_AT: "pwa_install_dismissed_at",
    SESSION_COUNT: "pwa_session_count",
    INSTALLED_DETECTED: "pwa_installed_detected",
  },
};
