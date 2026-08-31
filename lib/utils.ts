import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

export function formatThousands(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseThousands(val: string | number | undefined | null): number {
  if (!val) return 0;
  const digits = String(val).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function formatDate(dateString: string | Date): string {
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(dateString: string | Date): string {
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DH${year}${month}${day}-${random}`;
}

export function generateRandomCode(prefix = "TX"): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/[^\d+]/g, "");
}

export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  const clean = cleanPhoneNumber(phone);
  // Standard Vietnamese Mobile: 10 digits starting with 03, 05, 07, 08, 09 or +84/84 followed by 9 digits
  const regex = /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/;
  return regex.test(clean);
}

export function getPhoneValidationError(phone: string): string | null {
  if (!phone || !phone.trim()) return "Vui lòng nhập số điện thoại.";
  const clean = cleanPhoneNumber(phone);
  if (/[a-zA-Z]/.test(phone)) return "Số điện thoại không được chứa chữ cái hay ký tự lạ.";
  if (clean.startsWith("0") && clean.length < 10) {
    return `Số điện thoại còn thiếu (${clean.length}/10 chữ số).`;
  }
  if (clean.startsWith("0") && clean.length > 10) {
    return `Số điện thoại bị thừa (${clean.length}/10 chữ số).`;
  }
  if (!isValidVietnamesePhone(clean)) {
    return "Đầu số không hợp lệ (hỗ trợ các đầu số VN: 03x, 05x, 07x, 08x, 09x).";
  }
  return null;
}

export function generateRequestNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RQ${year}${month}${day}-${random}`;
}

export function generateQuotationNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `QT${year}${month}${day}-${random}`;
}

export function compressImageFile(file: File, maxWidth = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function shareNativeOrCopy(options: {
  title: string;
  text?: string;
  url: string;
}): Promise<"SHARED" | "COPIED" | "FAILED"> {
  if (typeof window !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text || options.title,
        url: options.url,
      });
      return "SHARED";
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        return "FAILED";
      }
    }
  }

  // Fallback to clipboard copy
  if (typeof window !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url);
      return "COPIED";
    } catch {
      return "FAILED";
    }
  }

  return "FAILED";
}
