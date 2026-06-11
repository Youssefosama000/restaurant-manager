import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import NutritionCircle from "../charts/NutritionCircle";
import { type FoodItem } from "../../api/food";

export interface MealSizeData {
  id: string;
  name: string;
  price: string;
  sortOrder: string;
  ingredientQuantities: Record<string, number>; // ingredientId → grams
}

interface Props {
  ingredients: FoodItem[];
  onClose: () => void;
  onSave: (size: MealSizeData) => void;
  existing?: MealSizeData;
}

export default function AddMealSizeModal({ ingredients, onClose, onSave, existing }: Props) {
  const [name,      setName]      = useState(existing?.name ?? "");
  const [price,     setPrice]     = useState(existing?.price ?? "");
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder ?? "");
  const [quantities, setQuantities] = useState<Record<string, number>>(
    existing?.ingredientQuantities ?? Object.fromEntries(ingredients.map((i) => [i.id, 100]))
  );

  const setGrams = (id: string, val: string) => {
    const n = parseFloat(val);
    setQuantities((q) => ({ ...q, [id]: isNaN(n) || n < 0 ? 0 : n }));
  };

  /* Live nutrition */
  const totals = ingredients.reduce(
    (acc, item) => {
      const g = quantities[item.id] ?? 0;
      const r = g / 100;
      return {
        calories: acc.calories + Math.round(
          ((item.caloriesPer100g ?? 0) > 0
            ? item.caloriesPer100g
            : (item.protein ?? 0) * 4 + (item.fat ?? 0) * 9 + (item.carbs ?? 0) * 4
          ) * r
        ),
        protein:  acc.protein  + Math.round((item.protein ?? 0) * r * 10) / 10,
        fat:      acc.fat      + Math.round((item.fat     ?? 0) * r * 10) / 10,
        carbs:    acc.carbs    + Math.round((item.carbs   ?? 0) * r * 10) / 10,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  const totalMacros = totals.protein + totals.fat + totals.carbs || 1;

  const handleSave = () => {
    onSave({
      id: existing?.id ?? Date.now().toString(),
      name,
      price,
      sortOrder,
      ingredientQuantities: quantities,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slyce-border flex-shrink-0">
          <h2 className="text-base font-semibold text-slyce-dark">Add new meal size</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream transition-colors">
            <X size={16} className="text-slyce-grey" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Name + Sort Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slyce-dark mb-1.5 flex items-center gap-1">
                Name
                <span className="w-3.5 h-3.5 rounded-full bg-slyce-border flex items-center justify-center text-[9px] text-slyce-grey cursor-help" title="e.g. Small, Medium, Large">ⓘ</span>
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="eg. Medium"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-slyce-dark mb-1.5 flex items-center gap-1">
                Sort Order
                <span className="w-3.5 h-3.5 rounded-full bg-slyce-border flex items-center justify-center text-[9px] text-slyce-grey cursor-help" title="Display order">ⓘ</span>
              </label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                placeholder="2"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors" />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-medium text-slyce-dark mb-1.5 block">Price (EGP)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slyce-border placeholder:text-slyce-grey focus:outline-none focus:border-green-primary transition-colors" />
          </div>

          {/* Ingredients with gram inputs */}
          {ingredients.length > 0 && (
            <div className="space-y-2">
              {ingredients.map((item) => {
                const grams = quantities[item.id] ?? 100;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-1">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-base">🥩</div>
                    )}
                    <span className="text-xs text-slyce-dark flex-1 leading-snug">{item.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={grams}
                        onChange={(e) => setGrams(item.id, e.target.value)}
                        className="w-24 px-3 py-1.5 text-xs text-center rounded-xl border border-slyce-border focus:outline-none focus:border-green-primary transition-colors"
                        placeholder="100"
                      />
                      <span className="text-xs text-slyce-grey w-7">gram</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {ingredients.length === 0 && (
            <p className="text-xs text-slyce-grey text-center py-4 bg-cream rounded-xl">
              Add ingredients to the meal first
            </p>
          )}

          {/* Nutrition Info */}
          <div className="bg-cream rounded-2xl p-4">
            <p className="text-xs font-semibold text-slyce-grey mb-3">Nutrition Info</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-slyce-dark leading-none">
                  {totals.calories} <span className="text-xs font-medium text-slyce-grey">kcal</span>
                </p>
                <p className="text-[10px] text-slyce-grey mt-1">Total Calories</p>
              </div>
              <div className="flex gap-3 ml-auto">
                <NutritionCircle label="Protein" percentage={Math.round((totals.protein / totalMacros) * 100)} grams={totals.protein} color="#3DBF52" size={72} />
                <NutritionCircle label="Fats"    percentage={Math.round((totals.fat     / totalMacros) * 100)} grams={totals.fat}     color="#F5A623" size={72} />
                <NutritionCircle label="Carbs"   percentage={Math.round((totals.carbs   / totalMacros) * 100)} grams={totals.carbs}   color="#E74C3C" size={72} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slyce-border flex-shrink-0">
          <button onClick={handleSave} disabled={!name.trim()}
            className="w-full bg-green-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            Save Size
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
