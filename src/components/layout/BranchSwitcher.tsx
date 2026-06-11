import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Branch picker shown under the page title.
 * Loads the restaurant's branches (via the restaurant ID from the login token)
 * and lets the merchant choose which branch to monitor. The selected branch
 * drives Order History, the order Summary, and Opening Times.
 */
export default function BranchSwitcher() {
  const {
    branches,
    branchesLoading,
    branchesError,
    branchId,
    activeBranch,
    setBranchId,
  } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (branchesLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slyce-grey">
        <Loader2 size={12} className="animate-spin" /> Loading branches…
      </span>
    );
  }

  if (branchesError) {
    return (
      <span className="text-xs text-amber-600" title={branchesError}>
        Couldn’t load branches
      </span>
    );
  }

  if (branches.length === 0) {
    return <span className="text-xs text-slyce-grey">No branches found</span>;
  }

  const subtitle = (b: { area?: string; city?: string }) =>
    [b.area, b.city].filter(Boolean).join(", ");

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-green-primary hover:text-green-600 transition-colors"
      >
        {activeBranch?.name ?? "Select branch"}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl border border-slyce-border shadow-lg py-1.5 z-50">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slyce-grey">
            Switch branch
          </p>
          {branches.map((b) => {
            const isActive = b.id === branchId;
            const sub = subtitle(b);
            return (
              <button
                key={b.id}
                onClick={() => {
                  setBranchId(b.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-cream transition-colors ${
                  isActive ? "text-green-primary font-semibold" : "text-slyce-dark"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Store
                    size={14}
                    className={isActive ? "text-green-primary" : "text-slyce-grey"}
                  />
                  <span className="truncate">
                    {b.name}
                    {sub && (
                      <span className="text-slyce-grey font-normal"> · {sub}</span>
                    )}
                  </span>
                </span>
                {isActive && (
                  <Check size={14} className="text-green-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
