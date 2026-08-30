"use client";

import { useState } from "react";
import {
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Send,
  Search,
  Plus,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDateTime } from "@/lib/utils";
import { PartyType } from "@/types";

export default function BusinessPartiesPage() {
  const { parties } = useCommerceStore();
  const [activeTab, setActiveTab] = useState<"ALL" | PartyType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParties = parties.filter((p) => {
    const matchTab = activeTab === "ALL" || p.type === activeTab;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.phone.includes(searchQuery);
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          Khách Hàng & Đối Tác Kinh Doanh (Parties)
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Danh bạ thống nhất: Một đối tác có thể vừa là Khách mua hàng vừa là Nhà cung cấp
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl">
          {(["ALL", "CUSTOMER", "SUPPLIER", "BOTH"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {tab === "ALL" && `Tất cả (${parties.length})`}
              {tab === "CUSTOMER" && `Khách mua`}
              {tab === "SUPPLIER" && `Nhà cung cấp`}
              {tab === "BOTH" && `Hai chiều`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, công ty, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Parties Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map((party) => (
          <div
            key={party.id}
            className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {party.type}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {party.last_interacted_at ? formatDateTime(party.last_interacted_at) : "Mới tương tác"}
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {party.name}
                </h3>
                {party.company_name && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{party.company_name}</span>
                  </p>
                )}
              </div>

              <div className="mt-3 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{party.phone}</span>
                </p>
                {party.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{party.email}</span>
                  </p>
                )}
                {party.addresses?.[0] && (
                  <p className="flex items-center gap-1.5 text-[11px] text-neutral-500 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{party.addresses[0].full_address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-400 text-[10px]">Tổng chi tiêu:</span>
                <p className="font-black text-emerald-600">{formatVND(party.total_spent)}</p>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 text-[10px]">Đơn hàng:</span>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">{party.total_orders} đơn</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
