import { useState, useEffect } from "react";
import { Loader2, X, Package } from "lucide-react";
import {
  getBranchOrderById,
  updateOrderStatus,
  type Order,
  type OrderDetail,
  type OrderStatus,
} from "../../api/orders";

const STATUS_OPTIONS: OrderStatus[] = ["Pending", "Preparing", "OutForDelivery", "Delivered"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending:        "bg-yellow-50  text-yellow-700  border-yellow-200",
  Preparing:      "bg-blue-50    text-blue-700    border-blue-200",
  OutForDelivery: "bg-purple-50  text-purple-700  border-purple-200",
  Delivered:      "bg-green-50   text-green-700   border-green-200",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending:        "Pending",
  Preparing:      "Preparing",
  OutForDelivery: "Out for Delivery",
  Delivered:      "Delivered",
};

interface Props {
  order: Order;
  branchId: string;
  onClose: () => void;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
}

export default function OrderDetailPanel({ order, branchId, onClose, onStatusChange }: Props) {
  const [detail, setDetail]           = useState<OrderDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status as OrderStatus);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getBranchOrderById(branchId, order.id)
      .then((d) => { setDetail(d); setCurrentStatus(d.status as OrderStatus); })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order details"))
      .finally(() => setLoading(false));
  }, [branchId, order.id]);

  async function handleStatusChange(newStatus: OrderStatus) {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, newStatus);
      setCurrentStatus(newStatus);
      setDetail((prev) => prev ? { ...prev, status: newStatus } : prev);
      onStatusChange?.(order.id, newStatus);
    } finally {
      setUpdatingId(null);
    }
  }

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatAmount = (val?: number | null) => {
    if (val == null) return "—";
    return `EGP ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slyce-border flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-slyce-dark">Order Details</p>
            <p className="text-[11px] font-mono text-slyce-grey mt-0.5">{order.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-slyce-grey transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slyce-grey">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* Status + date */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {STATUS_LABELS[currentStatus] ?? currentStatus}
                </span>
                <span className="text-xs text-slyce-grey">{formatDate(detail.createdAt)}</span>
              </div>

              {/* Delivery / payment info */}
              {(detail.customerName || detail.customerPhone || detail.deliveryAddress || detail.paymentMethod) && (
                <div className="bg-cream rounded-xl p-4 space-y-1.5">
                  {detail.customerName && (
                    <p className="text-xs font-semibold text-slyce-dark">{detail.customerName}</p>
                  )}
                  {detail.customerPhone && (
                    <p className="text-xs text-slyce-grey">{detail.customerPhone}</p>
                  )}
                  {detail.deliveryAddress && (
                    <p className="text-xs text-slyce-grey">{detail.deliveryAddress}</p>
                  )}
                  {detail.paymentMethod && (
                    <p className="text-xs text-slyce-grey">
                      Payment: <span className="text-slyce-dark font-medium">{detail.paymentMethod.replace(/([A-Z])/g, " $1").trim()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              {detail.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-yellow-700 mb-1">Note</p>
                  <p className="text-xs text-yellow-800">{detail.notes}</p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-slyce-dark mb-3">Items ({detail.items.length})</p>
                {detail.items.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slyce-grey">
                    <Package size={22} className="mb-2" />
                    <p className="text-xs">No item details available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.items.map((item, i) => (
                      <div key={item.id ?? i} className="flex items-start justify-between gap-3 py-2.5 border-b border-slyce-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slyce-dark truncate">
                            {item.mealName ?? item.name ?? "Item"}
                          </p>
                          {item.sizeName && (
                            <p className="text-[10px] text-slyce-grey mt-0.5">{item.sizeName}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slyce-grey">×{item.quantity ?? 1}</p>
                          <p className="text-xs font-medium text-slyce-dark mt-0.5">
                            {formatAmount(item.totalPrice ?? (item.unitPrice != null && item.quantity != null ? item.unitPrice * item.quantity : item.unitPrice))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-slyce-border">
                <span className="text-sm font-semibold text-slyce-dark">Total</span>
                <span className="text-sm font-bold text-slyce-dark">
                  {formatAmount(detail.totalAmount ?? (detail.total as number | undefined))}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer: status update */}
        {!loading && !error && detail && (
          <div className="px-5 py-4 border-t border-slyce-border flex-shrink-0">
            <p className="text-[10px] font-semibold text-slyce-grey mb-2">UPDATE STATUS</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={currentStatus === s || updatingId === order.id}
                  onClick={() => handleStatusChange(s)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    currentStatus === s
                      ? "bg-green-primary text-white border-green-primary"
                      : "bg-white text-slyce-dark border-slyce-border hover:border-green-primary hover:text-green-primary"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
