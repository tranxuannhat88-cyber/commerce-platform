"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileQuestion,
  Plus,
  QrCode,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Inbox,
  AlertTriangle,
  X,
  Layers,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDate, formatDateTime, slugify, formatThousands, parseThousands } from "@/lib/utils";
import { CopyButton } from "@/components/shared/copy-button";
import { QRModal } from "@/components/shared/qr-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppUrlService } from "@/lib/services/url";
import { RequestRFQ, RequestType, RequestStatus } from "@/types";

export default function BuyerRequestsPage() {
  const { requests, createRequest, deleteRequest, quotations } = useCommerceStore();
  const [activeTab, setActiveTab] = useState<"ALL" | RequestStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<RequestRFQ | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // New Request Form State
  const [formType, setFormType] = useState<RequestType>("CUSTOM_MANUFACTURING");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBudget, setFormBudget] = useState("35.000.000");
  const [formLocation, setFormLocation] = useState("");
  const [formDeadlineDays, setFormDeadlineDays] = useState("7");

  // Dynamic Multiple Requirement Items
  const [requestItemsList, setRequestItemsList] = useState<Array<{
    name: string;
    quantity: string;
    unit: string;
    specification: string;
    target_price: string;
  }>>([
    { name: "Trục Inox 304 D25x180mm", quantity: "200", unit: "chi tiết", specification: "Tiện ren M16, dung sai ±0.01mm", target_price: "175.000" },
  ]);

  const handleAddItemRow = () => {
    setRequestItemsList([
      ...requestItemsList,
      { name: "", quantity: "100", unit: "cái", specification: "", target_price: "" },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setRequestItemsList(requestItemsList.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemField = (index: number, field: string, value: string) => {
    const updated = [...requestItemsList];
    const finalVal = field === "target_price" ? formatThousands(value) : value;
    updated[index] = { ...updated[index], [field]: finalVal };
    setRequestItemsList(updated);
  };

  const filteredRequests = requests.filter((r) => {
    const matchTab = activeTab === "ALL" || r.status === activeTab;
    const matchSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.request_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const deadline = new Date(Date.now() + Number(formDeadlineDays) * 86400000).toISOString();

    const parsedItems = requestItemsList
      .filter((it) => it.name.trim() !== "")
      .map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        request_id: "",
        name: it.name.trim(),
        quantity: Number(it.quantity) || 1,
        unit: it.unit.trim() || "cái",
        specification: it.specification.trim(),
        target_price: it.target_price ? parseThousands(it.target_price) : undefined,
        created_at: new Date().toISOString(),
      }));

    createRequest({
      request_type: formType,
      visibility: "PUBLIC_LINK",
      title: formTitle.trim(),
      slug: slugify(formTitle),
      description: formDesc.trim() || formTitle.trim(),
      target_budget: formBudget ? parseThousands(formBudget) : undefined,
      delivery_location: formLocation.trim() || "Toàn quốc",
      quotation_deadline: deadline,
      status: "OPEN",
      items: parsedItems.length > 0 ? parsedItems : [
        {
          id: `item-${Date.now()}`,
          request_id: "",
          name: formTitle.trim(),
          quantity: 1,
          unit: "gói",
          created_at: new Date().toISOString(),
        }
      ],
      attachments: [
        {
          id: `att-${Date.now()}`,
          request_id: "",
          file_name: "Ban-ve-ky-thuat-yeu-cau.pdf",
          file_url: "https://example.com/drawings/sample.pdf",
          file_size: 1850000,
          mime_type: "application/pdf",
          created_at: new Date().toISOString(),
        }
      ],
    });

    // Reset Form
    setFormTitle("");
    setFormDesc("");
    setFormBudget("");
    setFormLocation("");
    setIsCreateOpen(false);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "OPEN":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">Đang Mở Nhận Báo Giá</span>;
      case "QUOTING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Đã Có Báo Giá</span>;
      case "SELECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">Đã Chọn Nhà Cung Cấp</span>;
      case "CLOSED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600">Đã Đóng</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Yêu Cầu Mua Hàng & RFQ (Demand)
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tạo yêu cầu mua hoặc gia công nhiều hạng mục, gửi link qua Zalo/Email để các xưởng vào gửi báo giá
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Đăng Yêu Cầu Mới (RFQ)</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl w-full md:w-auto overflow-x-auto">
          {(["ALL", "OPEN", "QUOTING", "SELECTED", "CLOSED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {tab === "ALL" ? `Tất cả (${requests.length})` : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm yêu cầu RFQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Requests List Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((req) => {
          const reqUrl = AppUrlService.getRequestUrl(req.request_number);
          const quotesForReq = quotations.filter((q) => q.request_id === req.id);

          return (
            <div
              key={req.id}
              className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold">
                    {req.request_number}
                  </span>
                  {getStatusBadge(req.status)}
                  <span className="text-[11px] text-neutral-400">
                    Hạn báo giá: {req.quotation_deadline ? formatDate(req.quotation_deadline) : "Không giới hạn"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {req.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {req.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                  <span>
                    Ngân sách dự kiến:{" "}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {req.target_budget ? formatVND(req.target_budget) : "Thương lượng"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Giao hàng: <strong className="text-neutral-900 dark:text-neutral-100">{req.delivery_location || "Toàn quốc"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Số hạng mục: <strong className="text-neutral-900 dark:text-neutral-100">{req.items?.length || 1} món</strong>
                  </span>
                </div>
              </div>

              {/* Quotations summary & Share Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                <Link
                  href={`/buy/quotations?requestId=${req.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  <span>{quotesForReq.length} Báo giá nhận được</span>
                </Link>

                <div className="flex items-center gap-2">
                  <CopyButton text={reqUrl} label="Copy Link RFQ" className="text-xs" />
                  <button
                    onClick={() => setSelectedQR({ url: reqUrl, title: req.request_number, subtitle: req.title })}
                    className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                    title="Mã QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/r/${req.request_number}`}
                    target="_blank"
                    className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    title="Xem trang công khai"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setDeletingRequest(req)}
                    className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/40 text-neutral-400 transition-colors cursor-pointer"
                    title="Xóa yêu cầu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE REQUEST MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Đăng Yêu Cầu Mua Hàng (RFQ)
                </h3>
                <p className="text-xs text-neutral-500">
                  Tạo trang yêu cầu nhiều hạng mục để nhận báo giá từ các xưởng / nhà cung cấp
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Loại Yêu Cầu:
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as RequestType)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="CUSTOM_MANUFACTURING">Gia công sản xuất cơ khí / CNC / May mặc</option>
                  <option value="PRODUCT_REQUEST">Mua sắm vật tư / Sản phẩm công nghiệp</option>
                  <option value="SERVICE_REQUEST">Dịch vụ kỹ thuật / Bảo trì / Thi công</option>
                  <option value="PROCUREMENT_REQUEST">Thu mua số lượng lớn (B2B Procurement)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tiêu đề yêu cầu *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                />
              </div>

              {/* Multiple Items Specification */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Các Hạng Mục & Số Lượng Cần Mua:</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm hạng mục</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {requestItemsList.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tên chi tiết / vật tư"
                          value={item.name}
                          onChange={(e) => handleUpdateItemField(idx, "name", e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-xs font-bold"
                        />
                        <input
                          type="number"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemField(idx, "quantity", e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="ĐVT"
                          value={item.unit}
                          onChange={(e) => handleUpdateItemField(idx, "unit", e.target.value)}
                          className="w-16 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-600"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Giá mục tiêu"
                          value={item.target_price}
                          onChange={(e) => handleUpdateItemField(idx, "target_price", e.target.value)}
                          className="w-28 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-xs font-mono font-bold text-right"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={requestItemsList.length <= 1}
                          className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Quy cách / Dung sai / Tiêu chuẩn kỹ thuật..."
                        value={item.specification}
                        onChange={(e) => handleUpdateItemField(idx, "specification", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border text-xs text-neutral-600"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mô tả chi tiết & Yêu cầu giao nhận
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ yêu cầu vật liệu, phương thức giao hàng, nghiệm thu..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Budget & Location & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Ngân sách ước tính (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="35.000.000"
                      value={formBudget}
                      onChange={(e) => setFormBudget(formatThousands(e.target.value))}
                      className="w-full px-3 py-2 pr-7 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono font-bold text-right"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 font-bold pointer-events-none">
                      đ
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Địa điểm giao hàng
                  </label>
                  <input
                    type="text"
                    placeholder="TP.HCM, Bình Dương..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Thời hạn nhận báo giá (Ngày)
                  </label>
                  <input
                    type="number"
                    value={formDeadlineDays}
                    onChange={(e) => setFormDeadlineDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Attachments Note */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Tự động đính kèm file bản vẽ kỹ thuật và mã hóa fingerprint SHA-256 bảo vệ bản quyền.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Đăng Yêu Cầu & Lấy Link Báo Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {selectedQR && (
        <QRModal
          isOpen={true}
          onClose={() => setSelectedQR(null)}
          url={selectedQR.url}
          title={selectedQR.title}
          subtitle={selectedQR.subtitle}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deletingRequest}
        onClose={() => setDeletingRequest(null)}
        onConfirm={() => {
          if (deletingRequest) {
            deleteRequest(deletingRequest.id);
            setDeletingRequest(null);
          }
        }}
        title="Xác nhận xóa Yêu cầu (RFQ)"
        itemName={deletingRequest?.title}
        message={
          <span>
            Bạn có chắc chắn muốn xóa Yêu cầu mua hàng <strong className="font-mono">#{deletingRequest?.request_number}</strong> không? Link công khai để nhà cung cấp gửi báo giá sẽ bị đóng lại.
          </span>
        }
        confirmText="Xóa Yêu Cầu"
      />
    </div>
  );
}
