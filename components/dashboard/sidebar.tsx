"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  ShoppingBag,
  Send,
  FileQuestion,
  Inbox,
  Package,
  Warehouse,
  Wallet,
  Users,
  Store as StoreIcon,
  Settings,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  KeyRound,
  CreditCard,
  Eye,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { ContextSwitcher } from "./context-switcher";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { store, organization, currentContext } = useCommerceStore();

  const isPersonal = currentContext.context_type === "PERSONAL";

  const navSections: NavSection[] = [
    {
      title: "TỔNG QUAN",
      items: [
        { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: "BÁN HÀNG (SUPPLY)",
      items: [
        { href: "/sell/offers", label: "Sản phẩm & Dịch vụ", icon: Tag },
        { href: "/sell/orders", label: "Đơn bán hàng", icon: ShoppingBag },
        { href: "/sell/quotations", label: "Báo giá đã gửi", icon: Send },
      ],
    },
    {
      title: "MUA HÀNG (DEMAND / RFQ)",
      items: [
        { href: "/buy/requests", label: "Yêu cầu mua (RFQ)", icon: FileQuestion },
        { href: "/buy/quotations", label: "Báo giá nhận được", icon: Inbox },
      ],
    },
    {
      title: "VẬN HÀNH & TÀI CHÍNH",
      items: [
        { href: "/inventory", label: "Quản lý Kho", icon: Warehouse },
        { href: "/finance", label: "Thu – Chi & Sổ cái", icon: Wallet },
        { href: "/transactions", label: "Xác thực Giao dịch (Trust)", icon: ShieldCheck },
        { href: "/parties", label: "Khách hàng & Đối tác", icon: Users },
      ],
    },
    {
      title: "HỆ THỐNG",
      items: [
        { href: "/store", label: isPersonal ? "Cửa hàng của tôi" : "Cửa hàng & Kênh bán", icon: StoreIcon },
        { href: "/store/public-settings", label: "Hiển thị công khai", icon: Eye },
        { href: "/settings/billing", label: "Gói Dịch Vụ & Hạn Mức", icon: CreditCard },
        { href: "/settings/security", label: "Tài khoản & Passkey", icon: KeyRound },
        { href: "/settings", label: isPersonal ? "Cài đặt & Chuyển đổi" : "Thiết lập Tổ chức", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-900/20 shrink-0">
            <img src="/icons/icon-192.png" alt="Hinex" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-black text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
              HINEX
            </h1>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mt-1">
              Nền tảng giao dịch số
            </p>
          </div>
        </Link>
      </div>

      {/* Context Switcher on Sidebar */}
      <div className="px-3 pt-3">
        <ContextSwitcher />
      </div>

      {/* Quick View Public Store */}
      <div className="px-3 pt-2">
        <Link
          href={store.slug ? `/s/${store.slug}` : "/store"}
          target={store.slug ? "_blank" : undefined}
          title={store.slug ? "Xem trang cửa hàng giống như khách hàng nhìn thấy." : "Tạo cửa hàng của bạn"}
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#007C73] dark:text-[#00D1C2] bg-[#E6F7F4] dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-xl transition-colors border border-teal-200/80 dark:border-teal-900/60"
        >
          <span className="truncate">{store.slug ? "🏬 Xem cửa hàng" : "🏬 + Tạo cửa hàng"}</span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-[#0D1B2A] text-[#00D1C2] dark:bg-neutral-800 dark:text-[#00D1C2] shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#00D1C2]" : "text-neutral-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Store Footer Info */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">{store.store_name}</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileDashboardDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { store, organization, currentContext, currentUser } = useCommerceStore();

  if (!isOpen) return null;

  const isPersonal = currentContext.context_type === "PERSONAL";

  const navSections: NavSection[] = [
    {
      title: "TỔNG QUAN",
      items: [
        { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: "BÁN HÀNG (SUPPLY)",
      items: [
        { href: "/sell/offers", label: "Sản phẩm & Dịch vụ", icon: Tag },
        { href: "/sell/orders", label: "Đơn bán hàng", icon: ShoppingBag },
        { href: "/sell/quotations", label: "Báo giá đã gửi", icon: Send },
      ],
    },
    {
      title: "MUA HÀNG (DEMAND / RFQ)",
      items: [
        { href: "/buy/requests", label: "Yêu cầu mua (RFQ)", icon: FileQuestion },
        { href: "/buy/quotations", label: "Báo giá nhận được", icon: Inbox },
      ],
    },
    {
      title: "VẬN HÀNH & TÀI CHÍNH",
      items: [
        { href: "/inventory", label: "Quản lý Kho", icon: Warehouse },
        { href: "/finance", label: "Thu – Chi & Sổ cái", icon: Wallet },
        { href: "/transactions", label: "Xác thực Giao dịch (Trust)", icon: ShieldCheck },
        { href: "/parties", label: "Khách hàng & Đối tác", icon: Users },
      ],
    },
    {
      title: "HỆ THỐNG",
      items: [
        { href: "/store", label: isPersonal ? "Cửa hàng của tôi" : "Cửa hàng & Kênh bán", icon: StoreIcon },
        { href: "/settings/security", label: "Tài khoản & Passkey", icon: KeyRound },
        { href: "/settings", label: isPersonal ? "Cài đặt & Chuyển đổi" : "Thiết lập Doanh nghiệp", icon: Settings },
      ],
    },
  ];

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div className="relative w-[280px] max-w-[80vw] bg-white dark:bg-neutral-900 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left">
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-blue-900/20 shrink-0">
              <img src="/icons/icon-192.png" alt="Hinex" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-black text-xs text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
                HINEX
              </h1>
              <p className="text-[10px] text-neutral-500 truncate max-w-[130px] mt-1">
                {isPersonal ? (currentUser?.full_name || "Tài khoản cá nhân") : (organization.name && organization.name !== "Chưa có tổ chức" ? organization.name : "Tổ chức")}
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Context Switcher on Mobile Drawer */}
        <div className="px-3 pt-3">
          <ContextSwitcher />
        </div>

        {/* Quick View Public Store */}
        <div className="px-3 pt-2">
          <Link
            href={store.slug ? `/s/${store.slug}` : "/store"}
            target={store.slug ? "_blank" : undefined}
            onClick={onClose}
            title={store.slug ? "Xem trang cửa hàng giống như khách hàng nhìn thấy." : "Tạo cửa hàng của bạn"}
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#007C73] dark:text-[#00D1C2] bg-[#E6F7F4] dark:bg-teal-950/40 hover:bg-teal-100 rounded-xl border border-teal-200/80 dark:border-teal-900/60"
          >
            <span>{store.slug ? "🏬 Xem cửa hàng" : "🏬 + Tạo cửa hàng"}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "bg-[#0D1B2A] text-[#00D1C2] dark:bg-neutral-800 dark:text-[#00D1C2] font-semibold"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-[#00D1C2]" : "text-neutral-500"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
