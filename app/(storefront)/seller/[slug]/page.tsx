"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Star,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  QrCode,
  Share2,
  Store as StoreIcon,
  Tag,
  ArrowRight,
  Package,
  Award,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND } from "@/lib/utils";
import { SellerPublicProfileService } from "@/lib/storefront/seller-profile-service";
import { QRModal } from "@/components/shared/qr-modal";
import { CopyButton } from "@/components/shared/copy-button";

export default function SellerPublicProfilePage() {
  const params = useParams();
  const slug = (params?.slug as string) || "cong-ty-2k";

  const { store, organization, offers, products, orders, currentUser } = useCommerceStore();
  const [showQR, setShowQR] = useState(false);

  const isPersonalQuery = slug.startsWith("u-") || slug === "personal";
  const actorId = isPersonalQuery ? (currentUser?.id || "personal") : organization.id;

  const profile = SellerPublicProfileService.getSellerPublicProfile({
    actorId,
    organization,
    store,
    currentUser,
    offers,
    products,
    orders,
  });

  const profileUrl = typeof window !== "undefined" ? window.location.href : `/seller/${slug}`;

  const hasRealTransactions = profile.reputation.completed_transactions > 0;
  const hasRating = profile.reputation.rating_average !== null && profile.reputation.rating_average !== undefined && (profile.reputation.rating_count || 0) > 0;
  const hasTrustScore = profile.reputation.trust_score !== null && profile.reputation.trust_score !== undefined;
  const hasOnTime = profile.reputation.on_time_delivery_rate !== null && profile.reputation.on_time_delivery_rate !== undefined;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-28 text-neutral-900 dark:text-neutral-100">
      {/* 1. COVER BANNER */}
      <div className="h-40 sm:h-56 w-full bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 relative overflow-hidden">
        {profile.cover_image_url && (
          <img
            src={profile.cover_image_url}
            alt={profile.display_name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
      </div>

      {/* 2. PROFILE HERO & DETAILS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            {/* Left: Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative shrink-0">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={profile.display_name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-white dark:bg-neutral-900 border-4 border-white dark:border-neutral-900 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl border-4 border-white dark:border-neutral-900 shadow-xl">
                    {profile.actor_type === "ORGANIZATION" ? (
                      <Building2 className="w-12 h-12" />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                )}

                {profile.reputation.is_verified_business ? (
                  <div
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md"
                    title="Doanh nghiệp Đã Xác Thực"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : profile.reputation.is_phone_verified ? (
                  <div
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-500 text-white shadow-md"
                    title="Đã Xác Thực SĐT"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                    {profile.display_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {profile.actor_type === "ORGANIZATION" ? "✓ Verified Business" : "✓ Verified Seller"}
                  </span>
                </div>

                {profile.legal_name && profile.legal_name !== profile.display_name && (
                  <p className="text-xs text-neutral-500 font-medium">
                    Pháp nhân: {profile.legal_name}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-500">
                  {profile.region && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{profile.region}</span>
                    </span>
                  )}
                  <span>•</span>
                  <span>Gia nhập từ Tháng 1, 2026</span>
                </div>
              </div>
            </div>

            {/* Right: Share Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 transition-colors"
                title="Mã QR Hồ Sơ"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <CopyButton text={profileUrl} label="Chia sẻ Hồ Sơ" className="py-2.5 rounded-2xl" />
            </div>
          </div>

          {/* Bio / Description */}
          {profile.description && (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl">
              {profile.description}
            </p>
          )}

          {/* Opt-in Public Contacts */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 pt-2">
            {profile.public_contact_phone && (
              <span className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Hotline: {profile.public_contact_phone}</span>
              </span>
            )}
            {profile.public_business_email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span>{profile.public_business_email}</span>
              </span>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:underline font-bold"
              >
                <Globe className="w-4 h-4" />
                <span>Trang chủ chính thức</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* 3. SYSTEM-GENERATED REPUTATION METRICS (ZERO MOCK) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Chỉ Số Tín Nhiệm & Độ Tin Cậy
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">Kiểm chứng tự động</span>
          </div>

          {hasRealTransactions ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
              {/* Metric 1: Completed Transactions */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <p className="text-2xl font-black text-emerald-600">
                  {profile.reputation.completed_transactions}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold">Giao Dịch Hoàn Thành</p>
              </div>

              {/* Metric 2: Trust Score */}
              {hasTrustScore && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-blue-600 font-black text-2xl">
                    <span>{profile.reputation.trust_score}</span>
                    <span className="text-xs text-blue-400 font-normal">/100</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold">Điểm Tín Nhiệm</p>
                </div>
              )}

              {/* Metric 3: Star Rating */}
              {hasRating && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-2xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span>{profile.reputation.rating_average?.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold">
                    Đánh Giá ({profile.reputation.rating_count})
                  </p>
                </div>
              )}

              {/* Metric 4: On-time Delivery */}
              {hasOnTime && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1">
                  <p className="text-2xl font-black text-purple-600">
                    {profile.reputation.on_time_delivery_rate}%
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold">Giao Đúng Hạn</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-500">
              Chưa có đủ dữ liệu giao dịch để tính các chỉ số uy tín. Các chỉ số sẽ được cập nhật tự động khi người bán hoàn tất đơn hàng trên nền tảng.
            </div>
          )}
        </div>

        {/* 4. PUBLIC STORES */}
        {profile.public_stores.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-blue-600" />
              <span>Cửa Hàng Trực Thuộc ({profile.public_stores.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.public_stores.map((s) => (
                <Link
                  key={s.id}
                  href={`/${s.slug}`}
                  className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-blue-500 shadow-2xs hover:shadow-lg transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.store_name} className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 transition-colors">
                        {s.store_name}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {s.product_count} sản phẩm đang kinh doanh
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. ACTIVE PUBLIC OFFERS */}
        {profile.active_offers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-rose-600" />
              <span>Ưu Đãi Công Khai Đang Phát Hành ({profile.active_offers.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.active_offers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/${offer.store_slug}/o/${offer.slug}`}
                  className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 hover:border-rose-500 shadow-2xs hover:shadow-lg transition-all flex items-center gap-3.5 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                    {offer.image_url ? (
                      <img
                        src={offer.image_url}
                        alt={offer.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                      {offer.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                        {formatVND(offer.price)}
                      </span>
                      {offer.compare_at_price && offer.compare_at_price > offer.price && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          {formatVND(offer.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        url={profileUrl}
        title="Mã QR Hồ Sơ Người Bán"
        subtitle={`Quét để mở hồ sơ của ${profile.display_name}`}
      />
    </div>
  );
}
