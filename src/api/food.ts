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
    const res = await api.get<FoodItem | { food?: FoodItem; data?: FoodItem; item?: FoodItem }>(`/v1/food/${foodId}`);
    if (!res) return null;
    if ((res as FoodItem).id) return res as FoodItem;
    const r = res as { food?: FoodItem; data?: FoodItem; item?: FoodItem };
    return r.food ?? r.data ?? r.item ?? null;
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
