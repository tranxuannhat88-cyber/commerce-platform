"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PWA_CONFIG } from "@/lib/config/pwa";
import { IOSInstallModal } from "./ios-install-modal";
import { MobileBottomNav } from "./mobile-bottom-nav";
import {
  WifiOff,
  Wifi,
  Download,
  X,
  Sparkles,
  Smartphone,
  RefreshCw,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  isOnline: boolean;
  isStandalone: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isStandalone: false,
  isInstallable: false,
  isIOS: false,
  promptInstall: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isOnline, setIsOnline] = useState(true);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error - iOS specific standalone flag
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    const isStand = checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    try {
      const currentSessions = Number(localStorage.getItem(PWA_CONFIG.STORAGE_KEYS.SESSION_COUNT) || "0") + 1;
      localStorage.setItem(PWA_CONFIG.STORAGE_KEYS.SESSION_COUNT, currentSessions.toString());

      const dismissedAt = Number(localStorage.getItem(PWA_CONFIG.STORAGE_KEYS.INSTALL_DISMISSED_AT) || "0");
      const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

      const isEligible =
        !isStand &&
        currentSessions >= PWA_CONFIG.INSTALL_MIN_SESSIONS &&
        (dismissedAt === 0 || daysSinceDismissed >= PWA_CONFIG.INSTALL_COOLDOWN_DAYS);

      if (isEligible) {
        const isCriticalPublicFlow =
          pathname.includes("/checkout") ||
          pathname.includes("/order/") ||
          pathname.includes("/quote");

        if (!isCriticalPublicFlow) {
          const timer = setTimeout(() => {
            setShowInstallBanner(true);
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setSwUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredBanner(true);
      setTimeout(() => setShowRestoredBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(PWA_CONFIG.STORAGE_KEYS.INSTALLED_DETECTED, "true");
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem(PWA_CONFIG.STORAGE_KEYS.INSTALL_DISMISSED_AT, Date.now().toString());
    } catch {}
  };

  const handleApplyUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isStandalone,
        isInstallable: Boolean(deferredPrompt) || isIOS,
        isIOS,
        promptInstall,
      }}
    >
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Bạn đang ngoại tuyến. Dữ liệu tài chính & thanh toán đang được bảo vệ an toàn.</span>
        </div>
      )}

      {showRestoredBanner && isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
          <Wifi className="w-4 h-4" />
          <span>✓ Đã khôi phục kết nối Internet!</span>
        </div>
      )}

      {swUpdateAvailable && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/50 flex items-center justify-between gap-3 animate-in slide-in-from-right">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Có bản cập nhật mới!</p>
              <p className="text-[11px] text-slate-400">Làm mới để nhận tính năng mới nhất.</p>
            </div>
          </div>
          <button
            onClick={handleApplyUpdate}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cập nhật</span>
          </button>
        </div>
      )}

      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Thêm ứng dụng vào Màn hình chính
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Truy cập nhanh hơn, mở toàn màn hình không có thanh URL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={promptInstall}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>
            <button
              onClick={handleDismissInstall}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              title="Để sau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />

      {children}

      <MobileBottomNav />
    </PWAContext.Provider>
  );
}
