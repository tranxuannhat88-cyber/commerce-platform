"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface PublicStoreSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  totalProductsCount?: number;
}

export function PublicStoreSearch({
  searchQuery,
  onSearchChange,
  placeholder = "Tìm sản phẩm hoặc dịch vụ trong cửa hàng...",
  totalProductsCount,
}: PublicStoreSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-hidden text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all shadow-2xs"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          title="Xóa từ khóa tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
