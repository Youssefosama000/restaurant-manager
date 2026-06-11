import { useState } from "react";
import { Plus, MapPin, Phone, CheckCircle, Store, Loader2, AlertCircle } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import AddBranchModal from "../components/branches/AddBranchModal";
import { useAuth } from "../context/AuthContext";
import { activateBranch } from "../api/branches";

export default function BranchesPage() {
  const { branches, branchesLoading, branchesError, refreshBranches } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);

  async function handleActivate(branchId: string) {
    setActivating(branchId);
    setActivateError(null);
    try {
      await activateBranch(branchId);
      await refreshBranches();
    } catch (err) {
      setActivateError(err instanceof Error ? err.message : "Failed to activate branch.");
    } finally {
      setActivating(null);
    }
  }

  async function handleBranchAdded() {
    await refreshBranches();
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

      {activateError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl mb-4">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          {activateError}
        </div>
      )}

      {branchesLoading && (
        <div className="flex items-center gap-2 text-sm text-slyce-grey py-12 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading branches…
        </div>
      )}

      {!branchesLoading && (branches.length === 0 || branchesError) && (
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

      {!branchesLoading && branches.length > 0 && (
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

              {/* Activate button for inactive branches */}
              {!branch.isActive && (
                <button
                  onClick={() => handleActivate(branch.id)}
                  disabled={activating === branch.id}
                  className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-green-primary text-green-primary text-xs font-semibold hover:bg-green-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activating === branch.id ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Activating…
                    </>
                  ) : (
                    <>
                      <Phone size={12} />
                      Activate Branch
                    </>
                  )}
                </button>
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
