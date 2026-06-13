import { api } from "./client";

export interface IngredientQuantity {
  ingredientId: string;
  quantity: number;
}

export interface MealSizePayload {
  name: string;
  price: number;
  sortOrder: number;
  ingredientQuantities: IngredientQuantity[];
}

export interface AddMealPayload {
  categoryId: string;
  name: string;
  description: string;
  imgUrl: string;
  ingredients: string[];
  sizes: MealSizePayload[];
}

export interface AddMealResponse {
  id: string;
  name: string;
}

export async function addMeal(payload: AddMealPayload): Promise<AddMealResponse> {
  // Backend expects "IngredientQuantities" (capital I) — transform before sending
  const body = {
    ...payload,
    sizes: payload.sizes.map(({ ingredientQuantities, ...rest }) => ({
      ...rest,
      IngredientQuantities: ingredientQuantities,
    })),
  };
  return api.post<AddMealResponse>("/v1/meals", body, {
    withRestaurantId: true,
  });
}

export async function getMealById(mealId: string) {
  return api.get(`/v1/meals/${mealId}`);
}

export async function getPendingMealById(mealId: string) {
  return api.get(`/v1/meals/pending/${mealId}`);
}

export async function addSize(mealId: string, payload: MealSizePayload) {
  const { ingredientQuantities, ...rest } = payload;
  return api.post(`/v1/meals/${mealId}/sizes`, {
    ...rest,
    IngredientQuantities: ingredientQuantities,
  });
}

export async function removeSize(mealId: string, sizeId: string) {
  return api.delete(`/v1/meals/${mealId}/sizes/${sizeId}`);
}
