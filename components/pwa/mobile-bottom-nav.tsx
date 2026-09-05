"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Tag,
  ArrowLeftRight,
  ShieldCheck,
  User,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  // ONLY show MobileBottomNav on authenticated Seller Dashboard routes!
  // NEVER show on public storefront, offer pages, checkout, review, RFQ, or verification pages.
  const isDashboardRoute = (path: string | null): boolean => {
    if (!path) return false;
    if (path === "/") return true;
    const dashboardPrefixes = [
      "/sell",
      "/buy",
      "/inventory",
      "/finance",
      "/parties",
      "/settings",
      "/transactions",
      "/store",
      "/billing",
      "/onboarding",
    ];
    return dashboardPrefixes.some((prefix) => path.startsWith(prefix));
  };

  if (!isDashboardRoute(pathname)) {
    return null;
  }

  const navItems = [
    { label: "Trang chủ", href: "/", icon: Home, exact: true },
    { label: "Offer", href: "/sell/offers", icon: Tag },
    { label: "Giao dịch", href: "/transactions", icon: ArrowLeftRight },
    { label: "Danh tiếng", href: "/transaction/tx-current/verify", icon: ShieldCheck },
    { label: "Tài khoản", href: "/settings/security", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1B2A] border-t border-[#1E293B] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-2xl shadow-black/80 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-[#00D1C2] scale-105"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <div className={`relative ${isActive ? "drop-shadow-[0_0_8px_rgba(0,209,194,0.4)]" : ""}`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? "font-bold text-[#00D1C2]" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
