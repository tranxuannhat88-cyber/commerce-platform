import type { MetadataRoute } from "next";
import { PWA_CONFIG } from "@/lib/config/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_CONFIG.APP_NAME,
    short_name: PWA_CONFIG.APP_SHORT_NAME,
    description: PWA_CONFIG.APP_DESCRIPTION,
    start_url: PWA_CONFIG.PWA_START_URL,
    display: "standalone",
    background_color: PWA_CONFIG.APP_BACKGROUND_COLOR,
    theme_color: PWA_CONFIG.APP_THEME_COLOR,
    orientation: "portrait-primary",
    categories: ["business", "shopping", "productivity", "finance"],
    lang: "vi",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
