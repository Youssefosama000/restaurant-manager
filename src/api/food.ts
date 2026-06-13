import { api } from "./client";

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  caloriesPer100g: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl?: string;
}

export interface FoodSearchResponse {
  items?: FoodItem[];
  data?: FoodItem[];
}

/** Search internal food database */
export async function searchFood(
  term: string,
  pageSize = 20,
  pageNumber = 1
): Promise<FoodItem[]> {
  const params = new URLSearchParams({
    term,
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });
  const res = await api.get<FoodItem[] | FoodSearchResponse>(
    `/v1/food?${params}`
  );
  // Handle both array and wrapped-object responses
  if (Array.isArray(res)) return res;
  return (res as FoodSearchResponse).items ?? (res as FoodSearchResponse).data ?? [];
}

/** Get a single food item by its ID */
export async function getFoodById(foodId: string): Promise<FoodItem | null> {
  try {
    const res = await api.get<unknown>(`/v1/food/${foodId}`);
    if (!res) return null;
    const r = res as Record<string, unknown>;
    // Unwrap common envelope shapes
    const raw = (r.food ?? r.data ?? r.item ?? r.result ?? res) as Record<string, unknown>;
    const id = String(raw.id ?? raw.foodId ?? raw.FoodId ?? raw.ingredientId ?? raw.IngredientId ?? "");
    if (!id) return null;
    return {
      id,
      name: String(raw.name ?? raw.Name ?? raw.foodName ?? raw.FoodName ?? raw.ingredientName ?? raw.IngredientName ?? ""),
      description: raw.description ? String(raw.description) : undefined,
      caloriesPer100g: Number(raw.caloriesPer100g ?? raw.CaloriesPer100g ?? raw.calories ?? raw.Calories ?? raw.caloriesPerServing ?? raw.CaloriesPerServing ?? 0),
      protein: Number(raw.protein ?? raw.Protein ?? raw.proteinG ?? raw.ProteinG ?? 0),
      fat: Number(raw.fat ?? raw.Fat ?? raw.totalFat ?? raw.TotalFat ?? raw.fatG ?? raw.FatG ?? 0),
      carbs: Number(raw.carbs ?? raw.Carbs ?? raw.carbohydrates ?? raw.Carbohydrates ?? raw.carbsG ?? raw.CarbsG ?? 0),
      imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? raw.image ?? raw.Image ?? raw.imgUrl ?? raw.ImgUrl ?? "") || undefined,
    };
  } catch {
    return null;
  }
}

/** Search external food database */
export async function searchExternalFood(term: string): Promise<FoodItem[]> {
  const res = await api.post<FoodItem[] | FoodSearchResponse>(
    `/v1/food/external?searchterm=${encodeURIComponent(term)}`
  );
  if (Array.isArray(res)) return res;
  return (res as FoodSearchResponse).items ?? (res as FoodSearchResponse).data ?? [];
}
