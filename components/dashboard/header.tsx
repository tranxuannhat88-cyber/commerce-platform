"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Plus,
  QrCode,
  Tag,
  FileQuestion,
  ExternalLink,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { QRModal } from "@/components/shared/qr-modal";
import { AppUrlService } from "@/lib/services/url";
import { MobileDashboardDrawer } from "./sidebar";
import { ContextSwitcher } from "./context-switcher";

export function DashboardHeader() {
  const { notifications, markNotificationRead, store, currentUser, passkeys, subscription, currentContext } = useCommerceStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStoreQR, setShowStoreQR] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const storeUrl = AppUrlService.getStoreUrl(store.slug);

  const headerDisplayName =
    currentContext.context_type === "PERSONAL"
      ? (currentUser?.full_name || currentContext.display_name || "Cá nhân")
      : currentContext.display_name;

  return (
    <>
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Menu Trigger & Context Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[140px] sm:max-w-[220px]">
              {headerDisplayName}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hidden sm:inline">
              {currentContext.context_type === "PERSONAL" ? "👤 Cá nhân" : `🏢 Tổ chức (${currentContext.role || "Owner"})`}
            </span>
          </div>
        </div>

        {/* Action Buttons & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick QR button */}
          <button
            onClick={() => setShowStoreQR(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>QR Cửa Hàng</span>
          </button>

          {/* Quick Actions Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/sell/offers?create=true"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>+ Offer</span>
            </Link>

            <Link
              href="/buy/requests?create=true"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
            >
              <FileQuestion className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ RFQ</span>
            </Link>
          </div>
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Thông báo ({unreadCount} mới)
                </span>
                <span className="text-[10px] text-neutral-400">Tự động cập nhật</span>
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-4">Chưa có thông báo nào</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        n.is_read
                          ? "bg-transparent text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                          : "bg-blue-50/80 dark:bg-blue-950/40 text-neutral-900 dark:text-neutral-100 font-medium border border-blue-100 dark:border-blue-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{n.title}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Pill */}
        <Link
          href="/settings/billing"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-black hover:bg-blue-100 transition-colors"
          title="Xem hạn mức và gói dịch vụ"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{subscription.plan_code}</span>
        </Link>

        {/* User Account & Security Link */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800 hover:opacity-80 transition-opacity"
          title="Tài khoản & Cài đặt"
        >
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0 border border-blue-500/20">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              (currentUser?.full_name?.trim() ? currentUser.full_name.trim().charAt(0).toUpperCase() : "U")
            )}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[110px]">
              {currentUser?.full_name || "Thành viên"}
            </p>
            <p className="text-[10px] text-neutral-400 font-mono">
              {passkeys.length > 0 ? "🔑 Passkey On" : "📱 Phone OTP"}
            </p>
          </div>
        </Link>
      </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDashboardDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
      />

      {/* Store QR Modal */}
      <QRModal
        isOpen={showStoreQR}
        onClose={() => setShowStoreQR(false)}
        url={storeUrl}
        title="Mã QR Cửa Hàng"
        subtitle={`Quét để mở trực tiếp ${store.store_name}`}
      />
    </>
  );
}
