import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getBranchOrders, type Order, type OrderStatus } from "../../api/orders";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending:        "bg-yellow-50 text-yellow-700 border-yellow-200",
  Preparing:      "bg-blue-50   text-blue-700   border-blue-200",
  OutForDelivery: "bg-purple-50 text-purple-700 border-purple-200",
  Delivered:      "bg-green-50  text-green-700  border-green-200",
};

export default function RecentOrdersCard() {
  const { branchId } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    getBranchOrders(branchId)
      .then((list) => setOrders(list.slice(0, 5)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [branchId]);

  const formatAmount = (o: Order) => {
    const val = o.totalAmount ?? o.total;
    if (val == null) return "—";
    return `EGP ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white rounded-2xl p-5 mt-5">
      <h2 className="text-base font-semibold text-slyce-dark mb-4">Recent Orders</h2>

      {!branchId ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-slyce-grey">Select a branch to see its recent orders</p>
        </div>
      ) : loading ? (
        <div className="h-24 flex items-center justify-center gap-2 text-slyce-grey">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : error || orders.length === 0 ? (
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-slyce-grey">No recent orders</p>
        </div>
      ) : (
        <div className="divide-y divide-slyce-border">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 py-2.5">
              <span className="text-xs font-mono text-slyce-dark truncate w-20" title={o.id}>
                {o.id.slice(0, 8)}…
              </span>
              <span className="text-xs text-slyce-dark flex-1 truncate">
                {o.orderItemsCount != null
                  ? `${o.orderItemsCount} item${o.orderItemsCount === 1 ? "" : "s"}`
                  : "—"}
              </span>
              <span className="text-xs text-slyce-dark">{formatAmount(o)}</span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  STATUS_STYLES[o.status as OrderStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
