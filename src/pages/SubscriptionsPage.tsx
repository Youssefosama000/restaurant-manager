import { useState, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import { api } from "../api/client";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  deliveryDays: string[];
  timeSlot: string;
}

async function listSubscriptions(page = 1, pageSize = 20): Promise<Subscription[]> {
  const params = new URLSearchParams({ Page: String(page), PageSize: String(pageSize) });
  const res = await api.get<Subscription[] | { items: Subscription[] }>(`/v1/subscriptions?${params}`);
  return Array.isArray(res) ? res : (res as { items: Subscription[] }).items ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  paused:    "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function SubscriptionsPage() {
  const [subs,    setSubs]    = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      setSubs(await listSubscriptions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <MainLayout>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slyce-dark">Subscriptions</h1>
          <p className="text-xs text-slyce-grey mt-0.5">
            Customer meal subscriptions — <span className="font-mono">GET /v1/subscriptions</span>
          </p>
        </div>
        <button
          onClick={fetch}
          className="flex items-center gap-1.5 text-sm text-slyce-grey hover:text-green-primary transition-colors"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 px-5 py-3 border-b border-slyce-border">
          {["ID", "Status", "Billing", "Time Slot", "Days"].map((h) => (
            <span key={h} className="text-xs font-semibold text-slyce-grey">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-slyce-grey text-sm">
            Loading subscriptions…
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={fetch} className="text-xs text-green-primary hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && subs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <RefreshCcw size={24} className="text-slyce-border" />
            <p className="text-sm font-medium text-slyce-dark">No subscriptions yet</p>
            <p className="text-xs text-slyce-grey">
              Customer subscriptions will appear here once they subscribe.
            </p>
          </div>
        )}

        {!loading && !error && subs.map((sub) => {
          const statusKey = sub.status?.toLowerCase() ?? "active";
          return (
            <div key={sub.id} className="grid grid-cols-5 px-5 py-3.5 border-b border-slyce-border last:border-0 hover:bg-cream transition-colors">
              <span className="text-xs font-mono text-slyce-grey truncate pr-2">
                {sub.id.slice(0, 8)}…
              </span>
              <span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_COLORS[statusKey] ?? "bg-gray-100 text-gray-600"}`}>
                  {sub.status}
                </span>
              </span>
              <span className="text-xs text-slyce-dark capitalize">{sub.billingCycle}</span>
              <span className="text-xs text-slyce-dark">{sub.timeSlot}</span>
              <span className="text-xs text-slyce-grey">
                {(sub.deliveryDays ?? []).join(", ")}
              </span>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
