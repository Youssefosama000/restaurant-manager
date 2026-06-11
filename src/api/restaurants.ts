import { api } from "./client";

export interface RestaurantApplicationPayload {
  brandName: string;
  ownerFirstName: string;
  ownerLastName: string;
  companyEmail: string;
  OwnerEmail: string;
  ownerMobileNumber: string;
  companyMobileNumber: string;
  restaurantType: string;
  branchCount: number;
  description: string;
  mainBranchAddress: {
    city: string;
    area: string;
    streetName: string;
    streetNumber: string;
    latitude: number;
    longitude: number;
  };
}

export async function createRestaurantApplication(
  payload: RestaurantApplicationPayload
) {
  return api.post("/v1/restaurant-applications", payload);
}

export interface MenuCategory {
  id: string;
  name: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  imgUrl: string;
  sizes: MealSize[];
  // The menu listing returns price directly on the meal (not via sizes):
  originalPrice?: number;
  discountedPrice?: number | null;
  priceCurrency?: string;
  lowestCalorieOption?: number;
}

export interface MealSize {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
}

export interface MenuResponse {
  categories: MenuCategory[];
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function pick(o: unknown, key: string): unknown {
  return o && typeof o === "object" && key in (o as Record<string, unknown>)
    ? (o as Record<string, unknown>)[key]
    : undefined;
}

/**
 * The /menu endpoint has no documented response example, so we normalise
 * tolerantly: we unwrap common envelopes ({ data | menu | result }), locate the
 * categories array under several possible keys, and map category/meal/size
 * fields regardless of casing. This way the UI renders whatever shape the
 * backend actually returns instead of silently showing an empty menu.
 */
function normaliseMenu(res: unknown): MenuResponse {
  const root = pick(res, "data") ?? pick(res, "menu") ?? pick(res, "result") ?? res;

  const rawCats = Array.isArray(root)
    ? root
    : asArray(pick(root, "categories")).length
      ? asArray(pick(root, "categories"))
      : asArray(pick(root, "items"));

  const categories: MenuCategory[] = (rawCats as Array<Record<string, unknown>>).map((c) => {
    const rawMeals = asArray(c.meals).length
      ? asArray(c.meals)
      : asArray(c.items).length
        ? asArray(c.items)
        : asArray(c.products);

    const meals: Meal[] = (rawMeals as Array<Record<string, unknown>>).map((m) => ({
      id:          String(m.id ?? m.mealId ?? m.Id ?? ""),
      name:        String(m.name ?? m.Name ?? m.mealName ?? "Meal"),
      description: String(m.description ?? m.Description ?? ""),
      imgUrl:      String(m.imgUrl ?? m.imageUrl ?? m.image ?? m.ImgUrl ?? ""),
      originalPrice:       m.originalPrice != null ? Number(m.originalPrice) : undefined,
      discountedPrice:     m.discountedPrice != null ? Number(m.discountedPrice) : null,
      priceCurrency:       m.priceCurrency != null ? String(m.priceCurrency) : undefined,
      lowestCalorieOption: m.lowestCalorieOption != null ? Number(m.lowestCalorieOption) : undefined,
      sizes: asArray(m.sizes).map((s) => {
        const sz = s as Record<string, unknown>;
        return {
          id:        String(sz.id ?? sz.sizeId ?? ""),
          name:      String(sz.name ?? sz.Name ?? ""),
          price:     Number(sz.price ?? sz.Price ?? 0),
          sortOrder: Number(sz.sortOrder ?? sz.SortOrder ?? 0),
        };
      }),
    }));

    return {
      id:   String(c.id ?? c.categoryId ?? c.Id ?? ""),
      name: String(c.name ?? c.Name ?? c.categoryName ?? "Category"),
      meals,
    };
  });

  return { categories };
}

export async function getRestaurantMenu(
  restaurantId: string
): Promise<MenuResponse> {
  const res = await api.get<unknown>(
    `/v1/restaurants/${restaurantId}/menu`,
    { withRestaurantId: false }
  );
  return normaliseMenu(res);
}

export interface Category {
  id: string;
  name: string;
}

/**
 * GET /v1/restaurants/:restaurantId/categories — list categories directly.
 * Used to populate the category picker even when the menu has no meals yet.
 * Tolerant of array / { categories | items | data } and id/categoryId casing.
 */
export async function getCategories(restaurantId: string): Promise<Category[]> {
  const res = await api.get<unknown>(`/v1/restaurants/${restaurantId}/categories`);
  const root = pick(res, "data") ?? pick(res, "categories") ?? pick(res, "items") ?? res;
  const list = Array.isArray(root) ? root : asArray(pick(root, "categories"));
  return (list as Array<Record<string, unknown>>)
    .map((c) => ({
      id:   String(c.id ?? c.categoryId ?? c.Id ?? ""),
      name: String(c.name ?? c.Name ?? c.categoryName ?? "Category"),
    }))
    .filter((c) => !!c.id);
}

export async function createCategory(restaurantId: string, name: string) {
  return api.post(`/v1/restaurants/${restaurantId}/categories`, { Name: name });
}

/** PUT /v1/restaurants/:id/logo — update the restaurant's logo image URL */
export async function updateRestaurantLogo(restaurantId: string, imageUrl: string) {
  return api.put(`/v1/restaurants/${restaurantId}/logo`, { imageUrl });
}

/** GET /v1/restaurant-applications/:id — fetch a single application */
export async function getApplication(id: string) {
  return api.get(`/v1/restaurant-applications/${id}`);
}
