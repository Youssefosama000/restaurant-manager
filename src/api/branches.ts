import { api } from "./client";

export interface BranchPayload {
  branchName: string;
  branchContactNumber: string;
  city: string;
  area: string;
  streetNumber: string;
  streetName: string;
  Latitude: string;
  Longitude: string;
}

export interface ScheduleDay {
  day: string;
  openingTime: string;
  closingTime: string;
}

export async function addBranch(payload: BranchPayload) {
  return api.post("/v1/branches/", payload);
}

export async function activateBranch(branchId: string) {
  return api.patch(`/v1/branches/${branchId}/activate`, undefined, { withRestaurantId: true });
}

export async function getBranchDetails(branchId: string) {
  return api.get(`/v1/branches/${branchId}/details`, { withRestaurantId: true });
}

export async function setWorkingHours(branchId: string, schedule: ScheduleDay[]) {
  return api.post(`/v1/branches/${branchId}/working-hours`, { schedule }, { withRestaurantId: true });
}

export async function getAllergens(): Promise<{ id: string; name: string }[]> {
  const res = await api.get<{ id: string; name: string }[] | { items: { id: string; name: string }[] }>("/v1/food/allergens");
  return Array.isArray(res) ? res : (res as { items: { id: string; name: string }[] }).items ?? [];
}

// ─── Branch listing (drives the dashboard branch switcher) ──────────────────
// Backend contract: GET /v1/branches/dropdown
// The endpoint is scoped to the authenticated restaurant via the login token,
// so no restaurantId argument is required. Response shape:
//   { "branches": [ { "branchId": "...", "name": "..." } ] }
// normaliseBranches() stays tolerant of array / { branches | items | data }
// and of branchId/id + name casing.
export interface Branch {
  id: string;
  name: string;
  city?: string;
  area?: string;
  isActive?: boolean;
}

function normaliseBranches(res: unknown): Branch[] {
  const list = Array.isArray(res)
    ? res
    : ((res as { items?: unknown[]; branches?: unknown[]; data?: unknown[] })?.items ??
       (res as { branches?: unknown[] })?.branches ??
       (res as { data?: unknown[] })?.data ??
       []);
  return (list as Array<Record<string, unknown>>)
    .map((b) => ({
      id: (b.id ?? b.branchId ?? b.Id ?? b.BranchId) as string,
      name: (b.name ?? b.branchName ?? b.BranchName ?? b.Name ?? "Branch") as string,
      city: (b.city ?? b.City) as string | undefined,
      area: (b.area ?? b.Area) as string | undefined,
      isActive: (b.isActive ?? b.IsActive ?? b.active) as boolean | undefined,
    }))
    .filter((b) => !!b.id);
}

export async function getBranches(): Promise<Branch[]> {
  const res = await api.get("/v1/branches/dropdown", { withRestaurantId: true });
  return normaliseBranches(res);
}
