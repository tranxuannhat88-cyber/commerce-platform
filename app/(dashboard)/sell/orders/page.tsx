"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  CheckCheck,
  XCircle,
  QrCode,
  Zap,
  ChevronRight,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Star,
} from "lucide-react";
import { useCommerceStore } from "@/lib/db/store";
import { formatVND, formatDateTime } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";
import { QRModal } from "@/components/shared/qr-modal";
import { ReviewModal } from "@/components/reviews/review-modal";
import confetti from "canvas-confetti";

export default function SalesOrdersPage() {
  const { orders, updateOrderStatus, confirmPayment, updateOrderShippingQuote, reviews } = useCommerceStore();
  const [activeStatus, setActiveStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [simulatingPaymentId, setSimulatingPaymentId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Seller Shipping Quote State
  const [quoteFeeInput, setQuoteFeeInput] = useState<number>(0);
  const [quoteNotesInput, setQuoteNotesInput] = useState<string>("");
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState(false);

  useEffect(() => {
    fetch("/api/sync/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.orders?.length > 0) {
          window.dispatchEvent(new CustomEvent("commerce_storage_update", { detail: { key: "commerce_orders" } }));
        }
      })
      .catch(() => {});
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = activeStatus === "ALL" || o.order_status === activeStatus;
    const matchSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const handleSimulateWebhook = (orderId: string) => {
    setSimulatingPaymentId(orderId);
    setTimeout(() => {
      confirmPayment(orderId);
      setSimulatingPaymentId(null);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      // update selected order view
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                order_status: "CONFIRMED",
                payment: prev.payment ? { ...prev.payment, payment_status: "PAID" } : undefined,
              }
            : null
        );
      }
    }, 700);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "NEW":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Mới tạo</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Đã xác nhận</span>;
      case "PREPARING":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Đang chuẩn bị</span>;
      case "DELIVERING":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Đang giao</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white">Hoàn tất</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Đã hủy</span>;
    }
  };

  const getPaymentBadge = (order: Order) => {
    const method = order.payment_snapshot?.method_type || order.payment?.payment_method || "VIETQR";
    const status = order.payment?.payment_status;

    if (status === "PAID") {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white">✓ Đã thanh toán</span>;
    }

    switch (method) {
      case "COD":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">COD Chờ thu</span>;
      case "DEPOSIT":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
            Cọc ({order.payment_snapshot?.deposit_amount ? formatVND(order.payment_snapshot.deposit_amount) : "30%"})
          </span>
        );
      case "PAY_LATER":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600 text-white">
            Công nợ ({order.payment_snapshot?.terms?.replace('_', ' ') || "NET 30"})
          </span>
        );
      case "PAY_AT_STORE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">Tại cửa hàng</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">VietQR Chưa trả</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100">
          Quản Lý Đơn Bán Hàng
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Theo dõi đơn hàng phát sinh từ Trang cửa hàng, Offer và Báo giá đã chốt
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl">
          {(["ALL", "NEW", "CONFIRMED", "PREPARING", "DELIVERING", "COMPLETED", "CANCELLED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeStatus === st
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {st === "ALL" ? `Tất cả (${orders.length})` : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* ORDERS LIST TABLE */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Mã Đơn & Nguồn</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Thanh Toán</th>
                <th className="py-3 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-400 text-xs">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-blue-50/60 dark:hover:bg-blue-950/30 cursor-pointer transition-all group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                        {order.order_number}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {order.source_type === "SOURCE_QUOTATION" ? "📑 Từ Báo giá" : "🏪 Từ Trang cửa hàng"} • {formatDateTime(order.created_at)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {order.customer_name}
                      </div>
                      <div className="text-[11px] text-neutral-500">{order.customer_phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {order.items?.[0]?.item_name || "Sản phẩm"}
                      </div>
                      {(order.items?.length || 0) > 1 && (
                        <div className="text-[10px] text-neutral-400">
                          + {(order.items?.length || 0) - 1} mục khác
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-neutral-100">
                      {formatVND(order.total_amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(order)}
                        {order.payment?.payment_status === "UNPAID" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSimulateWebhook(order.id);
                            }}
                            disabled={simulatingPaymentId === order.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
                            title="Giả lập nhận Webhook thanh toán VietQR"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>{simulatingPaymentId === order.id ? "..." : "Test Pay"}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(order.order_status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Đơn hàng {selectedOrder.order_number}
                  </h3>
                  {getStatusBadge(selectedOrder.order_status)}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ngày tạo: {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Customer & Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700 text-xs">
              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Khách hàng</span>
                </p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedOrder.customer_name}</p>
                <p className="text-neutral-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedOrder.customer_phone}</span>
                </p>
                {selectedOrder.customer_email && (
                  <p className="text-neutral-500">{selectedOrder.customer_email}</p>
                )}
              </div>

              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Địa chỉ nhận hàng & Định vị</span>
                </p>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {selectedOrder.shipping_address?.full_address || "Giao dịch trực tiếp / Dịch vụ kỹ thuật"}
                </p>

                {(selectedOrder.shipping_address?.map_url || (selectedOrder.shipping_address?.latitude && selectedOrder.shipping_address?.longitude)) && (
                  <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center gap-2">
                    <a
                      href={selectedOrder.shipping_address.map_url || `https://maps.google.com/?q=${selectedOrder.shipping_address.latitude},${selectedOrder.shipping_address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>📍 Mở Google Maps chỉ đường ↗</span>
                    </a>
                  </div>
                )}

                {selectedOrder.customer_notes && (
                  <p className="mt-1.5 text-amber-700 dark:text-amber-400 font-medium">
                    Ghi chú: {selectedOrder.customer_notes}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Danh sách sản phẩm & dịch vụ
              </h4>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.item_name}</p>
                      {item.variant_name && (
                        <p className="text-[11px] text-neutral-500">Phân loại: {item.variant_name}</p>
                      )}
                      <p className="text-[11px] text-neutral-400">
                        {formatVND(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatVND(item.total_price)}
                    </div>
                  </div>
                ))}

                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Tạm tính:</span>
                    <span>{formatVND(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span>Phí giao hàng:</span>
                      {selectedOrder.shipping_snapshot?.method_name && (
                        <span className="text-[10px] text-neutral-400">({selectedOrder.shipping_snapshot.method_name})</span>
                      )}
                    </span>
                    <span className="font-bold">
                      {selectedOrder.shipping_status === "QUOTING" ? (
                        <span className="text-amber-600">⏳ Đang chờ báo phí ship</span>
                      ) : selectedOrder.shipping_fee === 0 ? (
                        <span className="text-emerald-600">0đ (Miễn phí)</span>
                      ) : (
                        <span className="text-neutral-800 dark:text-neutral-200">{formatVND(selectedOrder.shipping_fee)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    <span>Tổng tiền thanh toán:</span>
                    <span className="text-blue-600">{formatVND(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT & FULFILLMENT SNAPSHOT CARD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Snapshot */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Điều Kiện Thanh Toán (Snapshot)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {selectedOrder.payment_snapshot?.method_type || selectedOrder.payment?.payment_method || "VIETQR"}
                  </span>
                </div>

                <div className="space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <p>
                    <strong>Phương thức:</strong> {selectedOrder.payment_snapshot?.method_name || selectedOrder.payment?.payment_method}
                  </p>
                  {selectedOrder.payment_snapshot?.deposit_amount !== undefined && (
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 space-y-0.5">
                      <p>Tiền cọc cần thu: <strong>{formatVND(selectedOrder.payment_snapshot.deposit_amount)}</strong></p>
                      <p className="text-neutral-500">Còn lại thu khi giao: {formatVND(selectedOrder.payment_snapshot.remaining_amount || 0)}</p>
                    </div>
                  )}
                  {selectedOrder.payment_snapshot?.payment_due_date && (
                    <p className="text-purple-700 dark:text-purple-300 font-medium">
                      Hạn thanh toán công nợ: <strong>{new Date(selectedOrder.payment_snapshot.payment_due_date).toLocaleDateString("vi-VN")}</strong> ({selectedOrder.payment_snapshot.terms})
                    </p>
                  )}
                  {selectedOrder.payment_snapshot?.bank_account_snapshot && (
                    <p className="text-neutral-500">
                      Tài khoản nhận: {selectedOrder.payment_snapshot.bank_account_snapshot.bank_short_name} - {selectedOrder.payment_snapshot.bank_account_snapshot.account_number} ({selectedOrder.payment_snapshot.bank_account_snapshot.account_name})
                    </p>
                  )}
                </div>
              </div>

              {/* Fulfillment Snapshot */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Hình Thức Giao Nhận (Snapshot)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    {selectedOrder.fulfillment_snapshot?.method_type || "DELIVERY"}
                  </span>
                </div>

                <div className="space-y-1 text-neutral-600 dark:text-neutral-400 text-[11px]">
                  <p>
                    <strong>Hình thức:</strong> {selectedOrder.fulfillment_snapshot?.method_name || "Giao hàng tận nơi"}
                  </p>
                  {selectedOrder.fulfillment_snapshot?.pickup_location && (
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                      Điểm nhận: {selectedOrder.fulfillment_snapshot.pickup_location}
                    </p>
                  )}
                  {selectedOrder.fulfillment_snapshot?.estimated_delivery && (
                    <p className="text-neutral-500">
                      Thời gian dự kiến: {selectedOrder.fulfillment_snapshot.estimated_delivery}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SELLER SHIPPING QUOTE INPUT (For Quote Later Orders) */}
            {(selectedOrder.shipping_status === "QUOTING" || selectedOrder.shipping_snapshot?.method_type === "QUOTE_LATER") && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Xác Nhận Cước Vận Chuyển Cho Đơn Hàng (Báo Phí Sau)</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedOrder.shipping_status === "QUOTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedOrder.shipping_status === "QUOTED" ? "✓ Đã báo phí" : "⏳ Chờ báo giá"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Cước vận chuyển thực tế (đ) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      placeholder="Ví dụ: 2500000"
                      value={quoteFeeInput || ""}
                      onChange={(e) => setQuoteFeeInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Ghi chú cước xe tải / quy cách giao
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đã gồm cước xe tải 5 tấn + bốc xếp tận nơi..."
                      value={quoteNotesInput}
                      onChange={(e) => setQuoteNotesInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>

                {quoteSuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ Đã cập nhật cước vận chuyển và gửi thông báo tới khách hàng thành công!
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (quoteFeeInput < 0) return;
                      updateOrderShippingQuote(selectedOrder.id, quoteFeeInput, quoteNotesInput);
                      setQuoteSuccessMsg(true);
                      setTimeout(() => setQuoteSuccessMsg(false), 2500);
                      setSelectedOrder((prev) =>
                        prev
                          ? {
                              ...prev,
                              shipping_fee: quoteFeeInput,
                              total_amount: prev.subtotal - prev.discount_amount + quoteFeeInput,
                              shipping_status: "QUOTED",
                            }
                          : null
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Lưu & Báo Phí Vận Chuyển Cho Khách</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status Change Controls */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-3">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Cập nhật trạng thái đơn:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "PREPARING");
                    setSelectedOrder((p) => (p ? { ...p, order_status: "PREPARING" } : null));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  Đang chuẩn bị
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "DELIVERING");
                    setSelectedOrder((p) => (p ? { ...p, order_status: "DELIVERING" } : null));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  Đang giao hàng
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "COMPLETED");
                    setSelectedOrder((p) => (p ? { ...p, order_status: "COMPLETED" } : null));
                    confetti({ particleCount: 70, origin: { y: 0.6 } });
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  ✓ Hoàn tất đơn (Trừ kho)
                </button>
                <button
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, "CANCELLED");
                    setSelectedOrder((p) => (p ? { ...p, order_status: "CANCELLED" } : null));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Hủy đơn (Trả kho)
                </button>
              </div>

              {/* Review Buyer Option when Completed */}
              {selectedOrder.order_status === "COMPLETED" && (
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    Giao dịch đã hoàn tất. Bạn có thể đánh giá độ tin cậy của khách hàng.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Đánh Giá Người Mua</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verified Review Modal for Seller -> Buyer */}
      {showReviewModal && selectedOrder && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          order={selectedOrder}
          forcedRole="SELLER"
        />
      )}
    </div>
  );
}
