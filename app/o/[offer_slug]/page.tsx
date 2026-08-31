"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";

export default function ShortOfferRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const offerSlug = params?.offer_slug as string;
  const { offers, store } = useCommerceStore();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!offerSlug) return;

    // 1. Check local offers
    const local = offers.find((o) => o.slug === offerSlug || o.id === offerSlug);
    if (local) {
      const targetStoreSlug = local.store_slug || store.slug || "2k-store";
      router.replace(`/${targetStoreSlug}/o/${local.slug}`);
      return;
    }

    // 2. Fetch from server API
    fetch(`/api/storefront/offer?offer_slug=${encodeURIComponent(offerSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.success && data.offer) {
          const targetStoreSlug = data.offer.store_slug || data.store?.slug || store.slug || "2k-store";
          router.replace(`/${targetStoreSlug}/o/${data.offer.slug}`);
        } else {
          setErrorMsg("Không tìm thấy sản phẩm/ưu đãi này.");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error resolving short offer URL:", err);
        setErrorMsg("Lỗi khi kết nối máy chủ.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [offerSlug, offers, store, router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center">
        <div className="space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto text-rose-600">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {errorMsg}
          </h2>
          <p className="text-xs text-neutral-500">
            Đường link có thể đã hết hạn hoặc người bán đã ngừng phát hành ưu đãi.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 animate-pulse">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Đang chuyển hướng tới ưu đãi...</p>
        <p className="text-xs text-neutral-400">Tự động nạp thông tin sản phẩm và mã thanh toán</p>
      </div>
    </div>
  );
}
