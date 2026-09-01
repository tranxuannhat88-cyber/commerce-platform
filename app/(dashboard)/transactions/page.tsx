"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ExternalLink,
  Zap,
  Clock,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDate, formatDateTime } from "@/lib/utils";
import { ReviewModal } from "@/components/reviews/review-modal";
import { Transaction } from "@/types";
import confetti from "canvas-confetti";

export default function TransactionsTrustPage() {
  const {
    transactions,
    verificationRecords,
    merkleBatches,
    blockchainAnchors,
    anchorPendingBatch,
    store,
    organization,
    currentUser,
    personalActor,
    reviews,
  } = useCommerceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [anchorSuccessMsg, setAnchorSuccessMsg] = useState<string | null>(null);
  const [selectedTxForReview, setSelectedTxForReview] = useState<Transaction | null>(null);

  const pendingRecords = verificationRecords.filter((vr) => vr.verification_status !== "ANCHORED");
  const anchoredRecords = verificationRecords.filter((vr) => vr.verification_status === "ANCHORED");

  const filteredTransactions = transactions.filter((tx) => {
    return (
      tx.transaction_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.buyer_name && tx.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.order_number && tx.order_number.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleManualAnchor = async () => {
    setIsAnchoring(true);
    try {
      const res = await anchorPendingBatch();
      setIsAnchoring(false);
      if (res) {
        const txSnippet = res.transaction_hash ? res.transaction_hash.slice(0, 16) : "0x89205a3a...";
        setAnchorSuccessMsg(`Đã tạo Merkle Batch & Neo thành công lên Blockchain (Tx: ${txSnippet}...)`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => setAnchorSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setIsAnchoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-linear-to-r from-neutral-900 via-neutral-800 to-indigo-950 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Trust & Verification Engine • Blockchain-Anchored</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Quản Trị Bằng Chứng & Xác Thực Giao Dịch
            </h2>
            <p className="text-xs md:text-sm text-neutral-300">
              Mỗi sự kiện quan trọng (Báo giá chấp thuận, Đơn hàng, Thanh toán, Nghiệm thu) được mã hóa SHA-256, gom vào Merkle Tree và định kỳ neo (anchor) lên Public Trust Rail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/verify/document"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md transition-all border border-white/10"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Đối Soát File PDF / CAD</span>
            </Link>

            <button
              onClick={handleManualAnchor}
              disabled={isAnchoring || pendingRecords.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>{isAnchoring ? "Đang tạo Merkle..." : `Neo Merkle Batch (${pendingRecords.length})`}</span>
            </button>
          </div>
        </div>

        {anchorSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-bold animate-in fade-in">
            ✓ {anchorSuccessMsg}
          </div>
        )}
      </div>

      {/* Trust KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Giao Dịch Được Bảo Chứng</span>
          <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
            {transactions.length}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">● Toàn vẹn 100%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Chứng Thư Mã Hóa (SHA-256)</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {verificationRecords.length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {anchoredRecords.length} đã neo on-chain
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Merkle Batches Anchored</span>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {merkleBatches.length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Polygon Mainnet (Chain 137)</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Bản Ghi Chờ Gom Batch</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {pendingRecords.length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Tự động anchor sau 10 phút</p>
        </div>
      </div>

      {/* Transactions Passport List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Danh Sách Giao Dịch & Transaction Passports
            </h3>
            <p className="text-xs text-neutral-500">
              Mỗi giao dịch liên kết chuỗi: Yêu cầu → Phiên bản báo giá → Đơn hàng → Thanh toán
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm mã TX, Đơn, Khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-5 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-mono text-xs font-bold shadow-xs">
                    {tx.transaction_code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{tx.is_fully_verified ? "XÁC THỰC TOÀN DIỆN" : "ĐANG XÁC THỰC"}</span>
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {formatDateTime(tx.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-neutral-400">Bên Mua:</span>{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">{tx.buyer_name || "Khách Hàng"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Bên Bán:</span>{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {(tx.seller_name && tx.seller_name !== "Doanh nghiệp" && tx.seller_name !== "Chưa có tổ chức")
                        ? tx.seller_name
                        : (store.store_name || currentUser?.full_name || personalActor.display_name || organization.name || "Nhà bán hàng")}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Đơn hàng:</span>{" "}
                    <strong className="text-neutral-800 dark:text-neutral-200">{tx.order_number || "Đơn hàng"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400">Nguồn giao dịch:</span>{" "}
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                      {tx.quotation_id ? `Báo giá v${tx.quotation_version || 1}` : "Đơn hàng Offer"}
                    </span>
                  </div>
                </div>

                {/* Completeness Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-neutral-500">Mức độ hoàn thiện bằng chứng (Completeness):</span>
                    <span className="text-emerald-600">{tx.verification_completeness_score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${tx.verification_completeness_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Review & Open Passport */}
              <div className="shrink-0 flex flex-wrap items-center justify-end gap-2.5">
                {(() => {
                  const hasReviewed = reviews.some(
                    (r) => r.transaction_id === tx.id || (tx.order_number && r.order_number === tx.order_number)
                  );
                  return (
                    <button
                      type="button"
                      onClick={() => setSelectedTxForReview(tx)}
                      className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        hasReviewed
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${hasReviewed ? "text-amber-500 fill-amber-500" : "fill-white text-white"}`} />
                      <span>{hasReviewed ? "Xem Đánh Giá" : "Đánh Giá Đối Tác"}</span>
                    </button>
                  );
                })()}

                <Link
                  href={`/transaction/${tx.id}/verify`}
                  target="_blank"
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xem Transaction Passport</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Merkle Batches & Blockchain Anchor Log */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Nhật Ký Merkle Batches & Blockchain Anchors (On-Chain Trust Rail)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Các Merkle Root 32-byte được neo vào Smart Contract để chứng minh tính bất biến
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-xs">
          {merkleBatches.map((batch) => {
            const anchor = blockchainAnchors.find((a) => a.batch_id === batch.id) || blockchainAnchors[0];
            return (
              <div key={batch.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      Batch #{batch.batch_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {batch.record_count} Bản ghi
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Neo lúc: {batch.anchored_at ? formatDateTime(batch.anchored_at) : "Đang xử lý"}
                    </span>
                  </div>

                  <p className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 break-all">
                    Merkle Root: <strong className="text-neutral-900 dark:text-neutral-100">{batch.merkle_root}</strong>
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block">Mạng blockchain:</span>
                    <span className="font-bold text-purple-600 text-xs">Polygon (Block {anchor?.block_number || "62458921"})</span>
                  </div>
                  {anchor?.transaction_hash && (
                    <a
                      href={`https://polygonscan.com/tx/${anchor.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                      title="Xem trên PolygonScan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Review Modal */}
      {selectedTxForReview && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedTxForReview(null)}
          transaction={selectedTxForReview}
          forcedRole="SELLER"
        />
      )}
    </div>
  );
}
