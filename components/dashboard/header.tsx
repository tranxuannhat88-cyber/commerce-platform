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
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { QRModal } from "@/components/shared/qr-modal";
import { AppUrlService } from "@/lib/services/url";

export function DashboardHeader() {
  const { notifications, markNotificationRead, store } = useCommerceStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStoreQR, setShowStoreQR] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const storeUrl = AppUrlService.getStoreUrl(store.slug);

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{store.store_name}</span>
          <span>/</span>
          <span className="text-neutral-400">Workspace V1</span>
        </div>
      </div>

      {/* Action Buttons & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick QR button */}
        <button
          onClick={() => setShowStoreQR(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <QrCode className="w-4 h-4 text-blue-600" />
          <span>QR Cửa Hàng</span>
        </button>

        {/* Quick Actions Dropdown */}
        <div className="flex items-center gap-2">
          <Link
            href="/sell/offers?create=true"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>+ Tạo Offer</span>
          </Link>

          <Link
            href="/buy/requests?create=true"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            <FileQuestion className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Tạo Yêu Cầu (RFQ)</span>
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
      </div>

      {/* Store QR Modal */}
      <QRModal
        isOpen={showStoreQR}
        onClose={() => setShowStoreQR(false)}
        url={storeUrl}
        title="Mã QR Cửa Hàng"
        subtitle={`Quét để mở trực tiếp ${store.store_name}`}
      />
    </header>
  );
}
