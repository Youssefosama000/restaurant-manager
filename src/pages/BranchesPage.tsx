import { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, CheckCircle, Store, Loader2 } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import AddBranchModal from "../components/branches/AddBranchModal";
import { useAuth } from "../context/AuthContext";
import { getRestaurantBranches, type Branch } from "../api/branches";

export default function BranchesPage() {
  const { restaurantId, refreshBranches } = useAuth();
  const [branches, setBranches]     = useState<Branch[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);

  const loadBranches = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getRestaurantBranches(restaurantId);
      setBranches(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { void loadBranches(); }, [loadBranches]);

  async function handleBranchAdded() {
    await refreshBranches();
    await loadBranches();
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slyce-dark">Branches</h1>
          <p className="text-xs text-slyce-grey mt-0.5">Manage your restaurant locations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-primary text-white text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          <Plus size={15} />
          Add Branch
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slyce-grey py-12 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading branches…
        </div>
      )}

      {!loading && (branches.length === 0 || error) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mb-4">
            <Store size={24} className="text-slyce-grey" />
          </div>
          <p className="text-sm font-semibold text-slyce-dark mb-1">No branches yet</p>
          <p className="text-xs text-slyce-grey mb-5">Add your first branch to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-primary text-white text-sm font-semibold hover:bg-green-600 transition-colors"
          >
            <Plus size={15} />
            Add Branch
          </button>
        </div>
      )}

      {!loading && branches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl p-5 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                    <Store size={16} className="text-green-primary" />
                  </div>
                  <p className="text-sm font-semibold text-slyce-dark leading-snug">{branch.name}</p>
                </div>
                {branch.isActive ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-green-primary bg-green-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    <CheckCircle size={10} />
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    Inactive
                  </span>
                )}
              </div>

              {/* Location */}
              {(branch.area || branch.city) && (
                <div className="flex items-center gap-1.5 text-xs text-slyce-grey">
                  <MapPin size={12} className="flex-shrink-0" />
                  {[branch.area, branch.city].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddBranchModal
          onClose={() => setShowModal(false)}
          onSuccess={handleBranchAdded}
        />
      )}
    </MainLayout>
  );
}
