"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Check } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string | React.ReactNode;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = "Xác nhận xóa",
  cancelText = "Hủy bỏ",
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              variant === "danger"
                ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                : variant === "warning"
                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                : "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            {itemName && (
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg truncate inline-block max-w-full">
                {itemName}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body */}
        <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed space-y-2">
          {message ? (
            typeof message === "string" ? (
              <p>{message}</p>
            ) : (
              message
            )
          ) : (
            <p>
              Bạn có chắc chắn muốn thực hiện thao tác xóa này không? Hành động này sẽ loại bỏ dữ liệu khỏi hệ thống và không thể hoàn tác.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
