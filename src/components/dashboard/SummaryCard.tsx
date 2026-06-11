import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import RevenueBarChart from "../charts/RevenueBarChart";
import { useAuth } from "../../context/AuthContext";
import { getOrdersTrend, type TrendPeriod, type TrendSummary } from "../../api/orders";

const tabs = ["Today", "Yesterday", "7 Days", "30 Days"];

const periodMap: Record<string, TrendPeriod> = {
  "Today":     "Today",
  "Yesterday": "Yesterday",
  "7 Days":    "Past7Days",
  "30 Days":   "Past30Days",
};

export default function SummaryCard() {
  const [activeTab, setActiveTab]   = useState("Today");
  const [trend, setTrend]           = useState<TrendSummary | null>(null);
  const [loading, setLoading]       = useState(false);
  const { branchId }                = useAuth();

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    setTrend(null);
    getOrdersTrend(branchId, periodMap[activeTab])
      .then(setTrend)
      .catch(() => setTrend(null))
      .finally(() => setLoading(false));
  }, [activeTab, branchId]);

  /* normalise — real shape: { summary:{totalOrders,totalRevenue}, chartData:[{timestamp,orders}] } */
  const t = trend as Record<string, unknown> | null;
  const summary = (t?.summary ?? t) as Record<string, unknown> | null;
  const totalOrders  = Number(summary?.totalOrders ?? summary?.orders ?? summary?.orderCount ?? 0);
  const totalRevenue = Number(summary?.totalRevenue ?? summary?.revenue ?? summary?.totalSales ?? 0);

  const rawChart = (t?.chartData ?? t?.data ?? t?.items ?? t?.points ?? []) as unknown[];
  const chartData = (Array.isArray(rawChart) ? rawChart : []).map((p, i) => {
    const pt = p as Record<string, unknown>;
    const label =
      pt.timestamp != null ? String(pt.timestamp)
      : pt.hour != null ? String(pt.hour)
      : pt.time != null ? String(pt.time)
      : pt.date != null ? new Date(pt.date as string).getDate().toString()
      : pt.day != null ? String(pt.day)
      : String(i + 1);
    return {
      day: label,
      orders: Number(pt.orders ?? pt.orderCount ?? pt.count ?? pt.totalOrders ?? 0),
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-slyce-dark">Summary</h2>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-green-primary text-white"
                    : "text-slyce-grey hover:bg-cream"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!branchId ? (
        <p className="text-xs text-slyce-grey py-4">Select a branch above to see trend data.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-slyce-grey">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : trend === null ? (
        <p className="text-xs text-slyce-grey py-4">No data available for this period.</p>
      ) : (
        <>
          {/* Metrics */}
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-xs text-slyce-grey mb-0.5">Orders</p>
              <p className="text-2xl font-bold text-slyce-dark">
                {totalOrders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slyce-grey mb-0.5">Revenue</p>
              <p className="text-2xl font-bold text-slyce-dark">
                EGP {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
              </p>
            </div>
          </div>

          {/* Chart */}
          <RevenueBarChart data={chartData.length > 0 ? chartData : undefined} />
        </>
      )}
    </div>
  );
}
