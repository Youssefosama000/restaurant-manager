import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Upload, ChevronDown, CheckCircle, AlertCircle, Loader2, Info, FolderPlus } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import AddIngredientsModal from "../components/menu/AddIngredientsModal";
import AddMealSizeModal, { type MealSizeData } from "../components/menu/AddMealSizeModal";
import { addMeal, getMealById, getPendingMealById, addSize, removeSize as deleteMealSize } from "../api/menu";
import { searchFood } from "../api/food";
import { getRestaurantMenu, getCategories, createCategory, type MenuCategory, type MenuResponse, type Category } from "../api/restaurants";
import { type FoodItem } from "../api/food";
import FoodImage from "../components/menu/FoodImage";
import { useAuth } from "../context/AuthContext";

export default function MenuManagementPage() {
  const { restaurantId } = useAuth();

  /* form state */
  const [mealName,        setMealName]        = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [category,        setCategory]        = useState("");
  const [mealImage,       setMealImage]       = useState<string | null>(null);
  const [ingredients,     setIngredients]     = useState<FoodItem[]>([]);
  const [sizes,           setSizes]           = useState<MealSizeData[]>([]);

  /* menu (categories + existing meals) loaded from the backend */
  const [categories,  setCategories]  = useState<MenuCategory[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError,   setMenuError]   = useState<string | null>(null);

  /* per-meal size management (view existing sizes + delete a size) */
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [mealSizes, setMealSizes] = useState<Record<string, Array<{ id: string; name: string; price: number; calories?: number }>>>({});
  const [loadingSizes, setLoadingSizes] = useState<string | null>(null);
  const [deletingSize, setDeletingSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  /* add size to existing meal */
  const [addingSizeToMealId,       setAddingSizeToMealId]       = useState<string | null>(null);
  const [addingSizeIngredients,    setAddingSizeIngredients]    = useState<FoodItem[]>([]);
  const [addingSizeNextSortOrder,  setAddingSizeNextSortOrder]  = useState(1);
  const [loadingMealForSize,       setLoadingMealForSize]       = useState<string | null>(null);

  /* create-category state */
  const [newCategory, setNewCategory] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  /* modal state */
  const [showIngModal,  setShowIngModal]  = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [editingSize,   setEditingSize]   = useState<MealSizeData | undefined>();

  /* save state */
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  /* ── Load the restaurant menu (categories + meals) from the API ── */
  const loadMenu = useCallback(async () => {
    if (!restaurantId) return;
    setMenuLoading(true);
    setMenuError(null);
    try {
      const [menuRes, standalone] = await Promise.all([
        getRestaurantMenu(restaurantId),
        getCategories(restaurantId).catch(() => [] as Category[]),
      ]);
      // Tolerate both { categories: [...] } and a bare array response
      const menuCats = (Array.isArray(menuRes)
        ? menuRes
        : (menuRes as MenuResponse)?.categories ?? []) as MenuCategory[];
      // Merge: keep menu categories (with their meals), then add any standalone
      // category that has no meals yet so it still shows up in the picker.
      const byId = new Map<string, MenuCategory>();
      for (const c of menuCats) byId.set(c.id, c);
      for (const c of standalone) {
        if (!byId.has(c.id)) byId.set(c.id, { id: c.id, name: c.name, meals: [] });
      }
      setCategories(Array.from(byId.values()));
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setMenuLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  /* ── View / delete a meal's sizes (GET /v1/meals/:id + DELETE .../sizes/:id) ── */
  const parseSizes = (res: unknown): Array<{ id: string; name: string; price: number; calories?: number }> => {
    const root = (res as Record<string, unknown>) ?? {};
    const raw =
      (root.sizes as unknown[]) ??
      ((root.data as Record<string, unknown> | undefined)?.sizes as unknown[]) ??
      ((root.meal as Record<string, unknown> | undefined)?.sizes as unknown[]) ??
      [];
    return (Array.isArray(raw) ? raw : []).map((s) => {
      const sz = s as Record<string, unknown>;
      const cal = sz.calories ?? sz.Calories ?? sz.totalCalories ?? sz.TotalCalories ??
        sz.calorie ?? sz.Calorie ?? sz.caloriesPerServing ?? sz.CaloriesPerServing ??
        sz.lowestCalorieOption ?? sz.LowestCalorieOption ?? sz.calorieCount ?? sz.CalorieCount ??
        sz.kcal ?? sz.Kcal ?? sz.energy ?? sz.Energy;
      return {
        id:       String(sz.sizeId ?? sz.id ?? sz.Id ?? ""),
        name:     String(sz.name ?? sz.Name ?? sz.sizeName ?? sz.SizeName ?? sz.title ?? sz.Title ?? ""),
        price:    Number(sz.price ?? sz.Price ?? 0),
        calories: cal != null ? Number(cal) : undefined,
      };
    });
  };

  const toggleMealSizes = async (mealId: string) => {
    setSizeError(null);
    if (expandedMeal === mealId) { setExpandedMeal(null); return; }
    setExpandedMeal(mealId);
    if (mealSizes[mealId]) return;
    setLoadingSizes(mealId);
    try {
      // Use the owner-view endpoint which returns sizes with calories.
      // Despite the name it works for both pending and approved meals.
      let res: unknown = null;
      let apiCallSucceeded = false;
      try {
        res = await getPendingMealById(mealId);
        apiCallSucceeded = true;
      } catch {
        try {
          res = await getMealById(mealId);
          apiCallSucceeded = true;
        } catch { /* both failed */ }
      }

      if (apiCallSucceeded) {
        const apiSizes = parseSizes(res);
        setMealSizes((prev) => ({ ...prev, [mealId]: apiSizes }));
      } else {
        setSizeError("Could not load sizes from server.");
      }
    } catch {
      setSizeError("Could not load sizes from server.");
    } finally {
      setLoadingSizes(null);
    }
  };

  const handleDeleteSize = async (mealId: string, sizeId: string) => {
    setSizeError(null);
    setDeletingSize(sizeId);
    try {
      await deleteMealSize(mealId, sizeId);
      setMealSizes((prev) => ({
        ...prev,
        [mealId]: (prev[mealId] ?? []).filter((s) => s.id !== sizeId),
      }));
      await loadMenu();
    } catch (err) {
      setSizeError(err instanceof Error ? err.message : "Failed to delete size");
    } finally {
      setDeletingSize(null);
    }
  };

  const handleOpenAddSizeForMeal = async (mealId: string) => {
    setSizeError(null);
    setLoadingMealForSize(mealId);
    try {
      // Compute next sort order from already-loaded sizes
      const loadedSizes = mealSizes[mealId] ?? [];
      setAddingSizeNextSortOrder(loadedSizes.length + 1);

      // Fetch the meal owner-view (works for both pending and approved meals).
      // The response includes ingredients: [{foodId, name}].
      let res: unknown;
      try {
        res = await getPendingMealById(mealId);
      } catch {
        res = await getMealById(mealId).catch(() => ({}));
      }
      const root = res as Record<string, unknown>;
      const meal = (root.meal ?? root.data ?? root.result ?? root) as Record<string, unknown>;

      // Helper to extract a FoodItem from any object-like ingredient record
      const mapIngredient = (i: Record<string, unknown>): FoodItem => ({
        id:   String(i.id ?? i.ingredientId ?? i.IngredientId ?? i.foodId ?? i.FoodId ?? ""),
        name: String(i.name ?? i.Name ?? i.ingredientName ?? i.IngredientName ?? i.FoodName ?? i.foodName ?? ""),
        caloriesPer100g: Number(i.caloriesPer100g ?? i.CaloriesPer100g ?? i.calories ?? i.Calories ?? i.CaloriesPerServing ?? 0),
        protein: Number(i.protein ?? i.Protein ?? i.proteinG ?? i.ProteinG ?? 0),
        fat:     Number(i.fat ?? i.Fat ?? i.totalFat ?? i.TotalFat ?? i.fatG ?? i.FatG ?? 0),
        carbs:   Number(i.carbs ?? i.Carbs ?? i.carbohydrates ?? i.Carbohydrates ?? i.carbsG ?? i.CarbsG ?? 0),
        imageUrl: String(i.imageUrl ?? i.ImageUrl ?? i.image ?? i.Image ?? i.imgUrl ?? i.ImgUrl ?? ""),
      });

      // Step 1: try to get ingredient objects directly from any known key
      const directRaw: unknown[] =
        (Array.isArray(meal.ingredients)         ? meal.ingredients         : null) ??
        (Array.isArray(meal.ingredientDetails)   ? meal.ingredientDetails   : null) ??
        (Array.isArray(meal.items)               ? meal.items               : null) ??
        (Array.isArray(meal.foods)               ? meal.foods               : null) ??
        (Array.isArray(root.ingredients)         ? root.ingredients         : null) ??
        (Array.isArray(root.ingredientDetails)   ? root.ingredientDetails   : null) ??
        [];

      // Object-shaped ingredients (have nutrition data already)
      const objectIngredients: FoodItem[] = (directRaw as Array<Record<string, unknown>>)
        .filter((i) => typeof i === "object" && i !== null)
        .map(mapIngredient)
        .filter((i) => !!i.id);

      // Step 2: also look in sizes[n].ingredientQuantities for nested ingredient data
      const sizesArr: Array<Record<string, unknown>> = (
        Array.isArray(meal.sizes) ? meal.sizes :
        Array.isArray(root.sizes) ? root.sizes : []
      ) as Array<Record<string, unknown>>;

      const sizeIngredients: FoodItem[] = sizesArr.flatMap((sz) => {
        const iq = sz.ingredientQuantities ?? sz.IngredientQuantities ?? sz.ingredients ?? [];
        if (!Array.isArray(iq)) return [];
        return (iq as Array<Record<string, unknown>>)
          .filter((i) => typeof i === "object" && i !== null)
          .map((i) => {
            // IngredientQuantity might nest the full ingredient under i.ingredient / i.food
            const nested = (i.ingredient ?? i.food ?? i.Ingredient ?? i.Food) as Record<string, unknown> | undefined;
            return mapIngredient(nested ?? i);
          })
          .filter((i) => !!i.id);
      });

      // Deduplicate by ID (prefer objectIngredients > sizeIngredients)
      const byId = new Map<string, FoodItem>();
      for (const f of [...sizeIngredients, ...objectIngredients]) if (f.id) byId.set(f.id, f);

      // Step 3: for ingredients with a name but missing nutrition, search by name
      const needNutrition = [...byId.values()].filter(
        (f) => f.name && f.name !== "undefined" && !f.protein && !f.fat && !f.carbs && !f.caloriesPer100g
      );
      if (needNutrition.length > 0) {
        const enriched = await Promise.all(
          needNutrition.map(async (f) => {
            try {
              const results = await searchFood(f.name, 3, 1);
              const match = results.find((r) => r.name.toLowerCase().includes(f.name.toLowerCase().split(" ")[0])) ?? results[0];
              if (match) return { ...match, id: f.id };
            } catch { /* ignore */ }
            return f;
          })
        );
        for (const f of enriched) { if (f?.id) byId.set(f.id, f); }
      }

      // Only keep ingredients we could actually resolve — discard empty placeholders.
      // If no names are found, the modal shows "Add ingredients to the meal first" (correct).
      const ingredients = [...byId.values()].filter((f) => !!f.id && !!f.name);
      setAddingSizeIngredients(ingredients);
      setAddingSizeToMealId(mealId);
    } catch {
      setAddingSizeIngredients([]);
      setAddingSizeToMealId(mealId);
    } finally {
      setLoadingMealForSize(null);
    }
  };

  const handleSaveExistingMealSize = async (size: import("../components/menu/AddMealSizeModal").MealSizeData) => {
    if (!addingSizeToMealId) return;
    const mealId = addingSizeToMealId;
    try {
      await addSize(mealId, {
        name:      size.name || "Size",
        price:     parseFloat(size.price) || 0,
        sortOrder: parseInt(size.sortOrder) || 1,
        ingredientQuantities: addingSizeIngredients.map((i) => ({
          ingredientId: i.id,
          quantity:     size.ingredientQuantities[i.id] ?? 0,
        })),
      });
      // Invalidate the in-memory size cache so it re-fetches from API next open
      setMealSizes((prev) => { const next = { ...prev }; delete next[mealId]; return next; });
      setAddingSizeToMealId(null);
      setAddingSizeIngredients([]);
      loadMenu();
    } catch (err) {
      setSizeError(err instanceof Error ? err.message : "Failed to add size");
    }
  };

  const handleImageUrlPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMealImage(e.target.value || null);
  };

  const openAddSize = () => { setEditingSize(undefined); setShowSizeModal(true); };
  const openEditSize = (s: MealSizeData) => { setEditingSize(s); setShowSizeModal(true); };

  const saveSize = (size: MealSizeData) => {
    setSizes((prev) => {
      const idx = prev.findIndex((s) => s.id === size.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = size; return next; }
      return [...prev, size];
    });
  };

  const removeSize = (id: string) => setSizes((p) => p.filter((s) => s.id !== id));

  const resetForm = () => {
    setMealName(""); setMealDescription(""); setCategory("");
    setMealImage(null); setIngredients([]); setSizes([]);
  };

  /* ── Create a new category via POST /v1/restaurants/:id/categories ── */
  const handleCreateCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    if (!restaurantId) { setSaveError("Set your Restaurant ID in Settings first."); return; }
    setSaveError(null);
    setCreatingCat(true);
    try {
      await createCategory(restaurantId, name);
      setNewCategory("");
      await loadMenu();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setCreatingCat(false);
    }
  };

  const handleAddMeal = async () => {
    if (!mealName.trim())    { setSaveError("Meal name is required."); return; }
    if (!restaurantId)       { setSaveError("Set your Restaurant ID in Settings first."); return; }
    if (!category)           { setSaveError("Select a category (create one below if the list is empty)."); return; }
    if (sizes.length === 0)  { setSaveError("Add at least one size."); return; }
    if (mealImage?.startsWith("data:")) {
      setSaveError("Please paste an image URL (starting with https://), not a base64 image.");
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await addMeal({
        categoryId:  category,
        name:        mealName,
        description: mealDescription,
        imgUrl:      mealImage ?? "",
        ingredients: ingredients.map((i) => i.id),
        sizes: sizes.map((s, idx) => ({
          name:      s.name || `Size ${idx + 1}`,
          price:     parseFloat(s.price)     || 0,
          sortOrder: parseInt(s.sortOrder)   || idx + 1,
          ingredientQuantities: ingredients.map((i) => ({
            ingredientId: i.id,
            quantity:     s.ingredientQuantities[i.id] ?? 100,
          })),
        })),
      });
      setSaveSuccess(true);
      resetForm();
      loadMenu();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to add meal.");
    } finally {
      setSaving(false);
    }
  };

  const hasMenu = categories.length > 0;

  return (
    <MainLayout>
      {showIngModal && (
        <AddIngredientsModal
          onClose={() => setShowIngModal(false)}
          onAdd={(items) => {
            setIngredients((prev) => {
              const ids = new Set(prev.map((i) => i.id));
              return [...prev, ...items.filter((i) => !ids.has(i.id))];
            });
          }}
        />
      )}

      {showSizeModal && (
        <AddMealSizeModal
          ingredients={ingredients}
          existing={editingSize}
          onClose={() => setShowSizeModal(false)}
          onSave={saveSize}
        />
      )}

      {addingSizeToMealId && (
        <AddMealSizeModal
          ingredients={addingSizeIngredients}
          defaultSortOrder={addingSizeNextSortOrder}
          onClose={() => { setAddingSizeToMealId(null); setAddingSizeIngredients([]); }}
          onSave={handleSaveExistingMealSize}
        />
      )}

      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slyce-dark">Menu Management</h1>
        {!restaurantId && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ No restaurant ID set — go to Settings.
          </p>
        )}
      </div>

      <div className="flex gap-5 items-start">

        {/* ── Left: live menu (categories + meals) ── */}
        <div className="flex-1 min-h-[60vh] bg-white rounded-2xl p-5">
          {menuLoading ? (
            <div className="h-full min-h-[50vh] flex items-center justify-center gap-2 text-slyce-grey">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading menu…</span>
            </div>
          ) : menuError ? (
            <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-red-600">{menuError}</p>
              <button onClick={loadMenu} className="mt-3 text-xs text-green-primary hover:underline">
                Try again
              </button>
            </div>
          ) : !hasMenu ? (
            <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="1.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  <path d="M8 12h8M12 8v8"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-slyce-dark">No meals yet</p>
              <p className="text-xs text-slyce-grey mt-1 max-w-xs">
                Create a category and add your first meal using the form on the right.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-sm font-bold text-slyce-dark mb-2">{cat.name}</h3>
                  {(cat.meals?.length ?? 0) === 0 ? (
                    <p className="text-xs text-slyce-grey px-1 pb-2">No meals in this category yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {cat.meals.map((meal) => (
                        <div key={meal.id} className="p-2.5 rounded-xl border border-slyce-border hover:bg-cream transition-colors">
                          <div className="flex gap-3">
                          {meal.imgUrl ? (
                            <img src={meal.imgUrl} alt={meal.name}
                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-cream-card flex items-center justify-center flex-shrink-0 text-lg">🍽️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-semibold text-slyce-dark truncate">{meal.name}</p>
                              {meal.reviewed === false && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 flex-shrink-0">
                                  Under Review
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slyce-grey line-clamp-2 mt-0.5">{meal.description}</p>
                            {/* Price and calories are shown per-size in the "Manage sizes" panel below */}
                          </div>
                          </div>
                          {/* ── Sizes manager: view existing sizes and delete them ── */}
                          <div className="mt-2 border-t border-slyce-border/60 pt-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => toggleMealSizes(meal.id)}
                                className="flex items-center gap-1 text-[10px] font-semibold text-slyce-grey hover:text-green-primary transition-colors"
                              >
                                <ChevronDown
                                  size={11}
                                  className={`transition-transform ${expandedMeal === meal.id ? "rotate-180" : ""}`}
                                />
                                Manage sizes
                                {meal.lowestCalorieOption != null && (
                                  <span className="text-slyce-grey font-normal">· {Math.round(meal.lowestCalorieOption)} cal</span>
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenAddSizeForMeal(meal.id)}
                                disabled={loadingMealForSize === meal.id}
                                className="flex items-center gap-1 text-[10px] font-semibold text-green-primary hover:text-green-700 transition-colors disabled:opacity-50"
                              >
                                {loadingMealForSize === meal.id
                                  ? <Loader2 size={10} className="animate-spin" />
                                  : <Plus size={10} />}
                                Add Size
                              </button>
                            </div>
                            {expandedMeal === meal.id && (
                              <div className="mt-2 space-y-1.5">
                                {sizeError && <p className="text-[10px] text-red-600">{sizeError}</p>}
                                {loadingSizes === meal.id ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-slyce-grey">
                                    <Loader2 size={11} className="animate-spin" /> Loading sizes…
                                  </div>
                                ) : (mealSizes[meal.id]?.length ?? 0) === 0 ? (
                                  <p className="text-[10px] text-slyce-grey">No sizes for this meal.</p>
                                ) : (
                                  mealSizes[meal.id].map((sz) => (
                                    <div key={sz.id} className="flex items-center justify-between gap-2 bg-white rounded-lg border border-slyce-border px-2 py-1">
                                      <span className="text-[10px] text-slyce-dark truncate">
                                        {sz.name}
                                        <span className="text-green-primary"> · {meal.priceCurrency ?? "EGP"} {sz.price}</span>
                                        {sz.calories != null && sz.calories > 0 && (
                                          <span className="text-slyce-grey"> · {Math.round(sz.calories)} cal</span>
                                        )}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteSize(meal.id, sz.id)}
                                        disabled={deletingSize === sz.id || sz.id.startsWith("local_")}
                                        className="flex-shrink-0 text-red-500 hover:text-red-600 disabled:opacity-30"
                                        title={sz.id.startsWith("local_") ? "Delete not available for locally cached sizes" : "Delete size"}
                                      >
                                        {deletingSize === sz.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: New Meal form ── */}
        <div className="w-80 flex-shrink-0 sticky top-4 space-y-0">
          <div className="bg-white rounded-2xl overflow-hidden">

            {/* Image preview */}
            <div className="relative bg-cream-card h-44 overflow-hidden">
              {mealImage && !mealImage.startsWith("data:") ? (
                <img src={mealImage} alt="Meal" className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    el.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              {mealImage && !mealImage.startsWith("data:") ? (
                <div className="hidden w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cream-card px-4 text-center">
                  <span className="text-xs text-red-500 font-medium">URL is not a direct image link</span>
                  <span className="text-[10px] text-slyce-grey">Right-click an image → "Copy image address"</span>
                </div>
              ) : mealImage?.startsWith("data:") ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
                  <span className="text-xs text-red-500 font-medium">Invalid image — paste a URL, not a file</span>
                  <button onClick={() => setMealImage(null)} className="text-[10px] text-slyce-grey underline">Clear</button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Upload size={22} className="text-slyce-grey" />
                  <span className="text-xs text-slyce-grey">Paste an image URL below</span>
                </div>
              )}
            </div>

            {/* Image URL input */}
            <div className="px-5 pt-3">
              <input
                type="url"
                value={mealImage ?? ''}
                onChange={handleImageUrlPaste}
                placeholder="https://example.com/image.jpg"
                className="w-full text-xs border border-slyce-border rounded-xl px-3 py-2 outline-none focus:border-green-primary bg-cream-card placeholder:text-slyce-grey"
              />
            </div>

            <div className="px-5 pt-4 pb-5 space-y-4">

              {/* Title */}
              <div className="flex items-start gap-2">
                <div>
                  <h2 className="text-base font-bold text-slyce-dark">New Meal</h2>
                  <p className="text-[10px] text-slyce-grey mt-0.5 flex items-center gap-1">
                    <Info size={10} className="flex-shrink-0" />
                    You can still edit availability after saving
                  </p>
                </div>
              </div>

              {/* Errors / success */}
              {saveError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-xl">
                  <CheckCircle size={13} /> Meal added successfully!
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slyce-dark block mb-1.5">Name</label>
                <input value={mealName} onChange={(e) => setMealName(e.target.value)}
                  placeholder="eg. whatever"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slyce-dark block mb-1.5">Description</label>
                <textarea value={mealDescription} onChange={(e) => setMealDescription(e.target.value)}
                  rows={3}
                  placeholder="Make your meals irresistible by sharing the full story; how they're carefully crafted, the fresh ingredients and bold flavors, and the health-focused touches that make each dish unique."
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors resize-none" />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slyce-dark block mb-1.5">Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border focus:outline-none focus:border-green-primary transition-colors appearance-none bg-white text-slyce-dark">
                    <option value="" disabled>
                      {menuLoading ? "Loading categories…" : categories.length === 0 ? "No categories — create one below" : "Select a category"}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slyce-grey pointer-events-none" />
                </div>

                {/* Create new category inline */}
                <div className="flex gap-2 mt-2">
                  <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors" />
                  <button onClick={handleCreateCategory} disabled={creatingCat || !newCategory.trim()}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-primary/10 text-green-primary text-xs font-semibold hover:bg-green-primary/20 transition-colors disabled:opacity-50">
                    {creatingCat ? <Loader2 size={12} className="animate-spin" /> : <FolderPlus size={12} />}
                    Add
                  </button>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slyce-dark flex items-center gap-1">
                    Ingredients
                    <span className="w-3.5 h-3.5 rounded-full bg-slyce-border flex items-center justify-center text-[9px] text-slyce-grey cursor-help" title="Ingredients used in this meal">ⓘ</span>
                  </label>
                  <button onClick={() => setShowIngModal(true)}
                    className="text-[10px] font-semibold text-white bg-green-primary px-2.5 py-1 rounded-full hover:bg-green-600 transition-colors">
                    + Add
                  </button>
                </div>

                {ingredients.length === 0 ? (
                  <button onClick={() => setShowIngModal(true)}
                    className="w-full py-4 border-2 border-dashed border-slyce-border rounded-xl flex items-center justify-center gap-1.5 hover:border-green-primary transition-colors group">
                    <Plus size={14} className="text-slyce-grey group-hover:text-green-primary transition-colors" />
                    <span className="text-xs text-slyce-grey group-hover:text-green-primary transition-colors">Search and add ingredients</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    {ingredients.map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-cream transition-colors">
                        <FoodImage name={item.name} imageUrl={item.imageUrl} className="w-8 h-8 rounded-lg flex-shrink-0" emojiSize="text-sm" />
                        <span className="text-xs text-slyce-dark flex-1 truncate leading-snug">{item.name}</span>
                        <button onClick={() => setIngredients((p) => p.filter((i) => i.id !== item.id))}
                          className="text-slyce-grey hover:text-red-500 transition-colors flex-shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => setShowIngModal(true)}
                      className="flex items-center gap-1 text-[11px] text-green-primary hover:text-green-700 transition-colors mt-1">
                      <Plus size={11} /> Add more
                    </button>
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slyce-dark">Sizes</label>
                </div>

                {sizes.length === 0 ? (
                  <div className="border-2 border-dashed border-slyce-border rounded-xl p-4 min-h-[80px] flex items-center justify-center">
                    <p className="text-xs text-slyce-grey">No sizes added yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sizes.map((s) => (
                      <div key={s.id}
                        className="flex items-center gap-2 px-3 py-2 bg-cream rounded-xl cursor-pointer hover:bg-cream-card transition-colors"
                        onClick={() => openEditSize(s)}
                      >
                        <div className="w-2 h-2 rounded-full bg-green-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-slyce-dark flex-1">{s.name || "Unnamed"}</span>
                        {s.price && (
                          <span className="text-[10px] text-slyce-grey">EGP {s.price}</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeSize(s.id); }}
                          className="text-slyce-grey hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={openAddSize}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slyce-border text-xs text-green-primary hover:border-green-primary hover:bg-green-primary/5 transition-colors font-medium">
                  <Plus size={13} /> Add new meal size
                </button>
              </div>

              {/* Submit */}
              <button onClick={handleAddMeal} disabled={saving}
                className="w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? "Saving…" : "Add Meal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
