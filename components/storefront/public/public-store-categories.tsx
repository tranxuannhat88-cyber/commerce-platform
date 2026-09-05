"use client";

import React from "react";
import { Tag } from "lucide-react";

interface PublicStoreCategoriesProps {
  categories: { id: string; name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  brandColor?: string;
}

export function PublicStoreCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  brandColor = "#00A88F",
}: PublicStoreCategoriesProps) {
  if (!categories || categories.length <= 1) {
    return null;
  }

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelectCategory("ALL")}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
          selectedCategory === "ALL"
            ? "text-white shadow-xs"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
        }`}
        style={selectedCategory === "ALL" ? { backgroundColor: brandColor } : {}}
      >
        Tất cả ({totalCount})
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.name)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? "text-white shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
            style={isSelected ? { backgroundColor: brandColor } : {}}
          >
            {cat.name} ({cat.count})
          </button>
        );
      })}
    </div>
  );
}
