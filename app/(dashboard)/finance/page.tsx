"use client";

import { useState } from "react";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDate, formatDateTime } from "@/lib/utils";
import { ExpenseCategory } from "@/types";

export default function FinancePage() {
  const { ledger, expenses, createExpense, financials } = useCommerceStore();
  const [activeTab, setActiveTab] = useState<"LEDGER" | "EXPENSES">("LEDGER");
  const [isCreateExpOpen, setIsCreateExpOpen] = useState(false);

  // Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>("DELIVERY");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expDesc.trim()) return;

    createExpense({
      organization_id: "org-2k-tech",
      category: expCategory,
      amount: Number(expAmount),
      paid_at: new Date().toISOString().split("T")[0],
      description: expDesc.trim(),
    });

    setExpAmount("");
    setExpDesc("");
    setIsCreateExpOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Thu – Chi & Sổ Cái Tài Chính (Ledger)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sổ cái giao dịch bất biến (Append-only) & Báo cáo Lợi nhuận gộp, Giá vốn, Chi phí vận hành
          </p>
        </div>

        <button
          onClick={() => setIsCreateExpOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-md cursor-pointer hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          <span>+ Ghi Khoản Chi Mới</span>
        </button>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 font-medium">Doanh Số (Sales)</span>
          <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 mt-1">
            {formatVND(financials.totalSales)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 font-medium">Giá Vốn (COGS)</span>
          <p className="text-lg font-black text-red-600 dark:text-red-400 mt-1">
            {formatVND(financials.totalCOGS)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 font-medium">Lãi Gộp (Gross)</span>
          <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
            {formatVND(financials.grossProfit)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 font-medium">Chi Phí Vận Hành</span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatVND(financials.totalOperatingExpenses)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 col-span-2 lg:col-span-1">
          <span className="text-[11px] text-neutral-500 font-medium">Lợi Nhuận Ước Tính</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatVND(financials.estimatedNetProfit)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "LEDGER"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          📖 Sổ Cái Bất Biến ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "EXPENSES"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          🧾 Quản Lý Chi Phí ({expenses.length})
        </button>
      </div>

      {/* Table Content */}
      {activeTab === "LEDGER" ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Loại Sự Kiện</th>
                <th className="py-3.5 px-4">Hướng (D/C)</th>
                <th className="py-3.5 px-4">Số Tiền (VNĐ)</th>
                <th className="py-3.5 px-4">Diễn Giải Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4 text-neutral-500">{formatDateTime(entry.created_at)}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {entry.entry_type}
                  </td>
                  <td className="py-3.5 px-4">
                    {entry.direction === "CREDIT" ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        + CREDIT (THU)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                        - DEBIT (CHI)
                      </span>
                    )}
                  </td>
                  <td className={`py-3.5 px-4 font-black ${entry.direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
                    {entry.direction === "CREDIT" ? `+${formatVND(entry.amount)}` : `-${formatVND(entry.amount)}`}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                    {entry.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ngày Chi</th>
                <th className="py-3.5 px-4">Danh Mục</th>
                <th className="py-3.5 px-4">Số Tiền</th>
                <th className="py-3.5 px-4">Nội Dung Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4 text-neutral-500">{formatDate(exp.paid_at)}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-700 dark:text-amber-400">
                    {exp.category}
                  </td>
                  <td className="py-3.5 px-4 font-black text-red-600">
                    {formatVND(exp.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                    {exp.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {isCreateExpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Ghi Khoản Chi Mới
              </h3>
              <button
                onClick={() => setIsCreateExpOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Danh mục chi phí *
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="DELIVERY">Vận chuyển / Thuê xe giao hàng</option>
                  <option value="MARKETING">Marketing & Quảng cáo</option>
                  <option value="RENT">Thuê mặt bằng / Xưởng</option>
                  <option value="UTILITIES">Điện, Nước, Internet</option>
                  <option value="LABOR">Nhân công / Thuê ngoài</option>
                  <option value="MATERIALS">Mua vật tư phụ / Dụng cụ</option>
                  <option value="OTHER">Chi phí khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Số tiền (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="350000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nội dung chi tiết *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ mục đích chi phí..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateExpOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-xl shadow-md cursor-pointer"
                >
                  Lưu & Ghi Sổ Cái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
