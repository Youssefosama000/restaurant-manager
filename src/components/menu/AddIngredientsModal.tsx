import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Loader2, Globe } from "lucide-react";
import FoodImage from "./FoodImage";
import { searchFood, searchExternalFood, type FoodItem } from "../../api/food";

interface Props {
  onClose: () => void;
  onAdd: (items: FoodItem[]) => void;
}

export default function AddIngredientsModal({ onClose, onAdd }: Props) {
  const [search,          setSearch]          = useState("");
  const [results,         setResults]         = useState<FoodItem[]>([]);
  const [selected,        setSelected]        = useState<Set<string>>(new Set());
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [externalResults, setExternalResults] = useState<FoodItem[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError,   setExternalError]   = useState<string | null>(null);
  const lastExternalTerm  = useRef<string>("");

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setExternalResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    setExternalResults([]);
    lastExternalTerm.current = "";
    try {
      const items = await searchFood(term);
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 400);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const handleExternalSearch = async () => {
    const term = search.trim();
    if (!term || lastExternalTerm.current === term) return;
    lastExternalTerm.current = term;
    setExternalLoading(true);
    setExternalError(null);
    try {
      const items = await searchExternalFood(term);
      setExternalResults(items);
    } catch (err) {
      setExternalError(err instanceof Error ? err.message : "External search failed");
    } finally {
      setExternalLoading(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allResults = [...results, ...externalResults];

  const handleConfirm = () => {
    onAdd(allResults.filter((i) => selected.has(i.id)));
    onClose();
  };

  const renderItem = (item: FoodItem) => {
    const isSelected = selected.has(item.id);
    return (
      <div key={item.id} onClick={() => toggle(item.id)}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
          isSelected ? "bg-green-primary/10 border border-green-primary/30" : "hover:bg-cream"
        }`}
      >
        <FoodImage name={item.name} imageUrl={item.imageUrl} className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-slyce-dark leading-snug">{item.name}</p>
          </div>
          <p className="text-[10px] text-slyce-grey mt-0.5">
            {item.caloriesPer100g || Math.round((item.protein ?? 0) * 4 + (item.fat ?? 0) * 9 + (item.carbs ?? 0) * 4)} kcal/100g · P {item.protein ?? 0}g · F {item.fat ?? 0}g · C {item.carbs ?? 0}g
          </p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected ? "bg-green-primary border-green-primary" : "border-slyce-border"
        }`}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-slyce-dark">Add Ingredients</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors">
            <X size={16} className="text-slyce-grey" />
          </button>
        </div>

        <div className="px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2.5">
            {loading
              ? <Loader2 size={14} className="text-green-primary animate-spin flex-shrink-0" />
              : <Search size={14} className="text-slyce-grey flex-shrink-0" />}
            <input
              type="text"
              placeholder="Search products and add ingredients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slyce-dark placeholder:text-slyce-grey outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-[10px] text-red-500 mt-1 px-1">{error}</p>}
        </div>

        <div className="px-5 overflow-y-auto flex-1 space-y-1 pb-3">
          {/* Empty / idle state */}
          {!loading && !search.trim() && (
            <p className="text-xs text-slyce-grey text-center py-8">Start typing to search ingredients…</p>
          )}

          {/* Internal results */}
          {results.map((item) => renderItem(item))}

          {/* No internal results message */}
          {!loading && search.trim() && results.length === 0 && externalResults.length === 0 && !externalLoading && (
            <p className="text-xs text-slyce-grey text-center pt-6">No results found for "{search}"</p>
          )}

          {/* External results */}
          {externalResults.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-slyce-border" />
                <span className="text-[10px] text-slyce-grey font-medium flex items-center gap-1">
                  <Globe size={10} /> More Results
                </span>
                <div className="flex-1 h-px bg-slyce-border" />
              </div>
              {externalResults.map((item) => renderItem(item))}
            </>
          )}

          {/* External loading */}
          {externalLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slyce-grey">
              <Loader2 size={13} className="animate-spin" /> Searching more ingredients…
            </div>
          )}

          {/* Always-visible external search button once internal search is done */}
          {!loading && search.trim() && !externalLoading && lastExternalTerm.current !== search.trim() && (
            <div className="flex flex-col items-center pt-4 pb-2 gap-2">
              <button
                onClick={handleExternalSearch}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Globe size={13} />
                Didn't find it? Search more ingredients
              </button>
              {externalError && <p className="text-[10px] text-red-500">{externalError}</p>}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slyce-border flex-shrink-0">
          <button onClick={handleConfirm} disabled={selected.size === 0}
            className="w-full bg-green-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Add Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
