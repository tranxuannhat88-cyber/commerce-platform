"use client";

import { useState } from "react";
import {
  Warehouse,
  AlertTriangle,
  ArrowDownUp,
  Package,
  History,
  TrendingDown,
  Plus,
  Search,
  CheckCircle,
  EyeOff,
  Ban,
  Boxes,
  RotateCcw,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatDateTime, formatVND } from "@/lib/utils";
import { MovementType, ProductStatus, AvailabilityStatus, Product } from "@/types";
import { ProductAvailabilityService } from "@/lib/inventory/availability";
import { ConfirmModal } from "@/components/shared/confirm-modal";

export default function InventoryPage() {
  const {
    products,
    inventory,
    movements,
    warehouses,
    updateProductStatus,
    updateManualAvailability,
    restockProduct,
    deleteProduct,
  } = useCommerceStore();

  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "STOCK" | "MOVEMENTS">("PRODUCTS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  // Delete & Restock Modal States
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [restockModalProduct, setRestockModalProduct] = useState<{ id: string; name: string } | null>(null);
  const [restockQty, setRestockQty] = useState(10);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    const avail = ProductAvailabilityService.computeAvailability({
      inventory_tracking: p.inventory_tracking,
      availability_status: p.availability_status,
      available_quantity: p.available_quantity,
    });

    if (selectedFilter === "ACTIVE") return p.product_status === "ACTIVE";
    if (selectedFilter === "IN_STOCK") return avail === "IN_STOCK";
    if (selectedFilter === "LOW_STOCK") return avail === "LOW_STOCK";
    if (selectedFilter === "OUT_OF_STOCK") return avail === "OUT_OF_STOCK";
    if (selectedFilter === "DISCONTINUED") return p.product_status === "DISCONTINUED";
    if (selectedFilter === "HIDDEN") return p.product_status === "HIDDEN";

    return true;
  });

  const getStatusBadge = (status?: ProductStatus) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Đang kinh doanh</span>;
      case "DISCONTINUED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">Ngừng kinh doanh</span>;
      case "HIDDEN":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">Đã ẩn</span>;
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 text-neutral-800">Bản nháp</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Đang kinh doanh</span>;
    }
  };

  const getAvailabilityBadge = (p: import("@/types").Product) => {
    const avail = ProductAvailabilityService.computeAvailability({
      inventory_tracking: p.inventory_tracking,
      availability_status: p.availability_status,
      available_quantity: p.available_quantity,
    });

    switch (avail) {
      case "IN_STOCK":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ✓ Còn hàng ({p.available_quantity ?? "Nhiều"})
          </span>
        );
      case "LOW_STOCK":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            ⚠️ Sắp hết ({p.available_quantity})
          </span>
        );
      case "OUT_OF_STOCK":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            ⛔ Tạm hết hàng (0)
          </span>
        );
      case "UNLIMITED":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ∞ Không giới hạn
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700">
            {avail}
          </span>
        );
    }
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case "OPENING":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">Tồn ban đầu</span>;
      case "PURCHASE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Nhập hàng</span>;
      case "SALE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">Xuất bán đơn</span>;
      case "RETURN":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">Trả hàng</span>;
      case "DAMAGED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 text-neutral-800">Hao hụt/Hỏng</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          Danh Mục Sản Phẩm & Quản Lý Tồn Kho
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Quản lý trạng thái kinh doanh, khả dụng tồn kho và tự động điều phối hiển thị trên Storefront / Offer
        </p>
      </div>

      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Tổng Sản Phẩm</span>
          <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
            {products.length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Lưu trữ trong thư viện</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Đang Còn Hàng</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {products.filter((p) => (p.available_quantity || 0) > 0 || p.availability_status === "IN_STOCK").length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Sẵn sàng nhận đơn</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Tạm Hết Hàng</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {products.filter((p) => p.product_status === "ACTIVE" && (p.available_quantity === 0 || p.availability_status === "OUT_OF_STOCK")).length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Tự động ẩn khỏi Offer</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
          <span className="text-xs font-medium text-neutral-500">Ngừng Kinh Doanh</span>
          <p className="text-2xl font-black text-neutral-500 mt-1">
            {products.filter((p) => p.product_status === "DISCONTINUED").length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Ẩn khỏi toàn bộ cửa hàng</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setActiveTab("PRODUCTS")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "PRODUCTS"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            📦 Thư Viện Sản Phẩm ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("STOCK")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "STOCK"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            🏢 Tồn Kho Chi Tiết ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab("MOVEMENTS")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "MOVEMENTS"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            📜 Lịch Sử Biến Động ({movements.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm tên, SKU, danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Filter Pills for Products View */}
      {activeTab === "PRODUCTS" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "Tất cả sản phẩm" },
            { id: "ACTIVE", label: "Đang kinh doanh" },
            { id: "IN_STOCK", label: "Còn hàng" },
            { id: "LOW_STOCK", label: "Sắp hết hàng" },
            { id: "OUT_OF_STOCK", label: "Tạm hết hàng" },
            { id: "DISCONTINUED", label: "Ngừng kinh doanh" },
            { id: "HIDDEN", label: "Đã ẩn" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === f.id
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB A: PRODUCT LIBRARY & AVAILABILITY CONTROLS */}
      {activeTab === "PRODUCTS" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
                <th className="py-3.5 px-4">Giá Bán</th>
                <th className="py-3.5 px-4">Tồn Khả Dụng</th>
                <th className="py-3.5 px-4">Trạng Thái Kinh Doanh</th>
                <th className="py-3.5 px-4">Khả Dụng Tồn Kho</th>
                <th className="py-3.5 px-4 text-right">Thao Tác Quản Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProducts.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border"
                          />
                        )}
                        <div>
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">{p.name}</p>
                          <p className="text-[11px] text-neutral-400">SKU: {p.sku || "N/A"} ● {p.category || "Chung"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {formatVND(p.price)}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm text-neutral-800 dark:text-neutral-200">
                      {p.inventory_tracking === false ? "∞ Manual" : `${p.available_quantity ?? 0} ${p.unit || "cái"}`}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.product_status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getAvailabilityBadge(p)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Restock Action for inventory-tracked products */}
                        {p.inventory_tracking !== false && (
                          <button
                            onClick={() => setRestockModalProduct({ id: p.id, name: p.name })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1 cursor-pointer"
                            title="Nhập thêm hàng vào kho"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nhập kho</span>
                          </button>
                        )}

                        {/* Toggle Manual In Stock / Out of Stock for non-tracked products */}
                        {p.inventory_tracking === false && (
                          <button
                            onClick={() =>
                              updateManualAvailability(
                                p.id,
                                p.availability_status === "OUT_OF_STOCK" ? "IN_STOCK" : "OUT_OF_STOCK"
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              p.availability_status === "OUT_OF_STOCK"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {p.availability_status === "OUT_OF_STOCK" ? "Đánh dấu còn hàng" : "Đánh dấu hết hàng"}
                          </button>
                        )}

                        {/* Status Switcher Dropdown */}
                        <select
                          value={p.product_status || "ACTIVE"}
                          onChange={(e) => updateProductStatus(p.id, e.target.value as ProductStatus)}
                          className="px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium cursor-pointer"
                        >
                          <option value="ACTIVE">Kinh doanh (ACTIVE)</option>
                          <option value="HIDDEN">Tạm ẩn (HIDDEN)</option>
                          <option value="DISCONTINUED">Ngừng kinh doanh (DISCONTINUED)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setDeletingProduct(p)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB B: STOCK VIEW */}
      {activeTab === "STOCK" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sản Phẩm / Phân Loại</th>
                <th className="py-3.5 px-4">Kho</th>
                <th className="py-3.5 px-4">Tồn Thực Tế</th>
                <th className="py-3.5 px-4">Giữ Chỗ</th>
                <th className="py-3.5 px-4">Khả Dụng</th>
                <th className="py-3.5 px-4">Mức Tối Thiểu</th>
                <th className="py-3.5 px-4">Tình Trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {inventory.map((item) => {
                const isLow = item.available <= item.minimum_stock;
                return (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">
                        {item.offer_name}
                      </div>
                      {item.variant_name && (
                        <div className="text-[11px] text-neutral-500">Phân loại: {item.variant_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                      {warehouses[0]?.name || "Kho Tổng"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                      {item.on_hand}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">
                      {item.reserved}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {item.available}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">{item.minimum_stock}</td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Sắp hết hàng</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Đủ hàng
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB C: MOVEMENTS HISTORY */}
      {activeTab === "MOVEMENTS" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Sản Phẩm</th>
                <th className="py-3.5 px-4">Loại Biến Động</th>
                <th className="py-3.5 px-4">Số Lượng</th>
                <th className="py-3.5 px-4">Trước → Sau</th>
                <th className="py-3.5 px-4">Ghi Chú Lý Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4 text-neutral-500">{formatDateTime(mov.created_at)}</td>
                  <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                    {mov.offer_name}
                  </td>
                  <td className="py-3.5 px-4">{getMovementBadge(mov.movement_type)}</td>
                  <td className={`py-3.5 px-4 font-bold ${mov.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    {mov.before_qty} → {mov.after_qty}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    {mov.note || "Giao dịch hệ thống"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Nhập Kho Thêm Sản Phẩm
                </h3>
              </div>
              <button
                onClick={() => setRestockModalProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Bạn đang thực hiện nhập thêm số lượng cho: <strong>{restockModalProduct.name}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Số lượng nhập thêm:
              </label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100"
              />
              <div className="flex items-center gap-2 pt-1">
                {[5, 10, 20, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRestockQty(num)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              💡 <strong>Tự động xuất hiện lại:</strong> Nếu sản phẩm đang ở trạng thái <em>Tạm hết hàng</em> và bị ẩn khỏi Offer, sau khi nhập kho sản phẩm sẽ <strong>tự động kích hoạt hiển thị lại trên Offer</strong> mà không cần tạo lại link.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockModalProduct(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  restockProduct(restockModalProduct.id, restockQty);
                  setRestockModalProduct(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận Nhập Kho</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            deleteProduct(deletingProduct.id);
            setDeletingProduct(null);
          }
        }}
        title="Xác nhận xóa Sản phẩm"
        itemName={deletingProduct?.name}
        message={
          <span>
            Bạn có chắc chắn muốn xóa sản phẩm này khỏi kho & danh mục không? Thao tác này sẽ loại bỏ sản phẩm khỏi hệ thống.
          </span>
        }
        confirmText="Xóa Sản Phẩm"
      />
    </div>
  );
}

