"use client";

import React from "react";
import { Grid, Layers } from "lucide-react";
import { Category } from "@/types";

interface TemplateCategoriesProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  brandColor?: string;
}

export function TemplateCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  brandColor = "#2563eb",
}: TemplateCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
          selectedCategory === null
            ? "text-white shadow-xs"
            : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
        }`}
        style={selectedCategory === null ? { backgroundColor: brandColor } : {}}
      >
        <Grid className="w-3.5 h-3.5" />
        <span>Tất Cả Sản Phẩm</span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? "text-white shadow-xs"
                : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50"
            }`}
            style={isSelected ? { backgroundColor: brandColor } : {}}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
