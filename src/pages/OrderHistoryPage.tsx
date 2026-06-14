import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import BranchSwitcher from "../components/layout/BranchSwitcher";
import { useAuth } from "../context/AuthContext";
import { getBranchOrders, updateOrderStatus, type Order, type OrderStatus } from "../api/orders";
import OrderDetailPanel from "../components/orders/OrderDetailPanel";

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

export default function OrderHistoryPage() {
  const { branchId }                = useAuth();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selected, setSelected]     = useState<Order | null>(null);

  function fetchOrders() {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    getBranchOrders(branchId)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchOrders(); }, [branchId]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    setUpdateError(null);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const formatDate = (raw?: string) => {
    if (!raw) return "—";
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatAmount = (val?: number | null) => {
    if (val == null) return "—";
    return `EGP ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <MainLayout>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slyce-dark">Order History</h1>
          <p className="text-xs text-slyce-grey mt-0.5 max-w-lg">
            Track all branch orders in real time. Click any row to view details.
          </p>
          <div className="mt-1.5">
            <BranchSwitcher />
          </div>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading || !branchId}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slyce-border text-slyce-dark hover:bg-cream transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {updateError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {updateError}
        </div>
      )}

      {!branchId && (
        <div className="bg-white rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-slyce-dark">Branch ID not configured</p>
          <p className="text-xs text-slyce-grey mt-1">Select a branch above to load its orders.</p>
        </div>
      )}

      {branchId && loading && (
        <div className="bg-white rounded-2xl p-10 flex items-center justify-center gap-2 text-slyce-grey">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading orders…</span>
        </div>
      )}

      {branchId && !loading && error && (
        <div className="bg-white rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button onClick={fetchOrders} className="mt-3 text-xs text-green-primary hover:underline">Try again</button>
        </div>
      )}

      {branchId && !loading && !error && (
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-3 border-b border-slyce-border">
            {["Order ID", "Items", "Amount", "Date", "Status", "Update"].map((col) => (
              <span key={col} className="text-xs font-semibold text-slyce-grey">{col}</span>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slyce-dark">No orders yet</p>
              <p className="text-xs text-slyce-grey mt-1">Orders will appear here once customers start ordering.</p>
            </div>
          ) : (
            <div className="divide-y divide-slyce-border">
              {orders.map((order) => {
                const status = order.status as OrderStatus;
                const isUpdating = updatingId === order.id;
                const total = order.totalAmount ?? (order.total as number | undefined);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className="grid grid-cols-6 px-5 py-3 items-center hover:bg-cream/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-mono text-slyce-dark truncate pr-2" title={order.id}>
                      {order.id.slice(0, 8)}…
                    </span>
                    <span className="text-xs text-slyce-dark truncate pr-2">
                      {order.orderItemsCount != null ? `${order.orderItemsCount} item${order.orderItemsCount === 1 ? "" : "s"}` : "—"}
                    </span>
                    <span className="text-xs text-slyce-dark">{formatAmount(total)}</span>
                    <span className="text-xs text-slyce-grey">{formatDate(order.createdAt ?? (order.date as string | undefined))}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border w-fit ${STATUS_STYLES[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      {isUpdating ? (
                        <Loader2 size={14} className="animate-spin text-slyce-grey" />
                      ) : (
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="text-xs border border-slyce-border rounded-lg px-2 py-1 bg-white text-slyce-dark focus:outline-none focus:border-green-primary transition-colors cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selected && branchId && (
        <OrderDetailPanel
          order={selected}
          branchId={branchId}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status) => {
            setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
            setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
          }}
        />
      )}
    </MainLayout>
  );
}
