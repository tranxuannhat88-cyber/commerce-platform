"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { CreateOrgModal } from "./create-org-modal";
import { WorkContext } from "@/types";

interface ContextSwitcherProps {
  className?: string;
  isCompact?: boolean;
}

export function ContextSwitcher({ className = "", isCompact = false }: ContextSwitcherProps) {
  const { currentContext, getWorkContexts, switchContext, currentUser, personalActor } = useCommerceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const contexts = getWorkContexts();
  const personalContext = contexts.find((c) => c.context_type === "PERSONAL");
  const orgContexts = contexts.filter((c) => c.context_type === "ORGANIZATION");

  const currentDisplayName =
    currentContext.context_type === "PERSONAL"
      ? (currentUser?.full_name || personalActor.display_name?.replace(/\s*\(Cá nhân\)$/, "") || currentContext.display_name || "Tài khoản cá nhân")
      : currentContext.display_name;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (actorId: string) => {
    switchContext(actorId);
    setIsOpen(false);
  };

  const getPlanBadgeClass = (planCode?: string) => {
    switch (planCode) {
      case "PRO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300";
      case "BUSINESS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300";
      case "STARTER":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 transition-all text-left group cursor-pointer space-y-1.5"
        >
          {/* Top Row: Icon + Full Organization / Personal Name + Dropdown Chevron */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {currentContext.context_type === "PERSONAL" ? (
                <User className="w-4 h-4" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors leading-snug"
                title={currentDisplayName}
              >
                {currentDisplayName}
              </div>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Bottom Row: Context Type indicator on left, 50% smaller Role & Plan badges on the bottom-right */}
          <div className="flex items-center justify-between text-[9px] text-neutral-400 dark:text-neutral-500 pl-1 pt-0.5">
            <span className="font-semibold truncate">
              {currentContext.context_type === "PERSONAL" ? "👤 Cá nhân" : "🏢 Doanh nghiệp"}
            </span>

            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {currentContext.role && currentContext.context_type === "ORGANIZATION" && (
                <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-neutral-200/90 dark:bg-neutral-700/90 text-neutral-600 dark:text-neutral-300">
                  {currentContext.role}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-tight ${getPlanBadgeClass(currentContext.plan_code)}`}>
                Gói {currentContext.plan_code || "FREE"}
              </span>
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 space-y-2">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Chuyển Không Gian Làm Việc
            </div>

            {/* 1. PERSONAL CONTEXT */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-neutral-500">CÁ NHÂN</div>
              {personalContext && (
                <button
                  type="button"
                  onClick={() => handleSelect(personalContext.actor_id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    personalContext.is_active
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold border border-blue-200/80 dark:border-blue-900/60"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="truncate font-bold text-neutral-900 dark:text-neutral-100">
                        {currentUser?.full_name || personalContext.display_name?.replace(/\s*\(Cá nhân\)$/, "") || "Tài khoản cá nhân"}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-normal">Một người tự vận hành</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getPlanBadgeClass(personalContext.plan_code)}`}>
                      {personalContext.plan_code || "FREE"}
                    </span>
                    {personalContext.is_active && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              )}
            </div>

            {/* 2. ORGANIZATIONS CONTEXTS */}
            <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div className="px-2 text-[10px] font-bold text-neutral-500">TỔ CHỨC & DOANH NGHIỆP</div>
              {orgContexts.length === 0 ? (
                <div className="p-3 text-center text-[11px] text-neutral-400">
                  Chưa tham gia tổ chức nào
                </div>
              ) : (
                orgContexts.map((org) => (
                  <button
                    key={org.actor_id}
                    type="button"
                    onClick={() => handleSelect(org.actor_id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      org.is_active
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 font-bold border border-blue-200/80 dark:border-blue-900/60"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="truncate">{org.display_name}</p>
                        <p className="text-[10px] text-neutral-400 font-normal">
                          Vai trò: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{org.role || "MEMBER"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getPlanBadgeClass(org.plan_code)}`}>
                        {org.plan_code || "FREE"}
                      </span>
                      {org.is_active && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* 3. CREATE ORG ACTION */}
            <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateOrg(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Tạo tổ chức mới</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      <CreateOrgModal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        onSuccess={() => setShowCreateOrg(false)}
      />
    </>
  );
}
