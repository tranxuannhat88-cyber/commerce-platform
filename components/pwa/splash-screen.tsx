"use client";

import React, { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only show splash on initial visit in the session
    const hasShown = sessionStorage.getItem("hinex_splash_shown");
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        try {
          sessionStorage.setItem("hinex_splash_shown", "true");
        } catch {}
      }, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0D1B2A] text-white transition-opacity duration-500 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Decorative background glow circles */}
      <div className="absolute w-72 h-72 rounded-full bg-[#00A88F]/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-48 h-48 rounded-full bg-[#00D1C2]/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-5 animate-in zoom-in-90 duration-500">
        {/* 3D App Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-linear-to-br from-[#00D1C2] via-[#00A88F] to-[#0D1B2A] shadow-2xl shadow-teal-900/50">
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#0D1B2A] flex items-center justify-center p-2">
            <img
              src="/icons/icon-192.png?v=2.1.0"
              alt="Hinex Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/icons/hinex-mark.png";
              }}
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white">
            HINEX
          </h1>
          <p className="text-xs sm:text-sm font-medium text-neutral-300 max-w-xs">
            Nền tảng giao dịch số & Bằng chứng thương mại
          </p>
        </div>

        {/* Loading / Connecting indicator */}
        <div className="pt-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00D1C2] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#00A88F] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#007C73] animate-bounce" />
        </div>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 text-[11px] text-neutral-500 font-medium">
        hinex.vn • Khóa xác thực Merkle & VietQR
      </div>
    </div>
  );
}
