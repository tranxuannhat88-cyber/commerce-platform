"use client";

import { QRCodeSVG } from "qrcode.react";
import { X, Download, ExternalLink } from "lucide-react";
import { CopyButton } from "./copy-button";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export function QRModal({ isOpen, onClose, url, title, subtitle }: QRModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        )}

        <div className="flex justify-center p-4 my-5 bg-white rounded-xl shadow-inner border border-neutral-100 w-fit mx-auto">
          <QRCodeSVG value={url} size={220} level="H" includeMargin />
        </div>

        <div className="p-3 mb-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs font-mono text-neutral-600 dark:text-neutral-300 break-all border border-neutral-200 dark:border-neutral-700">
          {url}
        </div>

        <div className="flex items-center justify-center gap-3">
          <CopyButton text={url} label="Copy Link" className="py-2.5 px-4 text-sm" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở trang</span>
          </a>
        </div>
      </div>
    </div>
  );
}
