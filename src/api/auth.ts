import { api, session } from "./client";

export interface LoginResult {
  name: string | null;
  restaurantId: string | null;
  branchId: string | null;
}

/** Decode JWT payload without verifying signature — just to read claims */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    const padded  = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Find the restaurant ID inside JWT claims regardless of the exact key name */
function extractRestaurantId(claims: Record<string, unknown>): string | null {
  // 1 — check well-known key names first
  const knownKeys = [
    "restaurant_id", "RestaurantId", "restaurantId",
    "restaurant", "rid", "X-Restaurant-Id",
  ];
  for (const key of knownKeys) {
    const val = claims[key];
    if (typeof val === "string" && UUID_RE.test(val)) return val;
  }

  // 2 — scan ALL claims: find any UUID-valued key whose name hints at restaurant
  for (const [key, val] of Object.entries(claims)) {
    if (typeof val === "string" && UUID_RE.test(val) &&
        key.toLowerCase().includes("restaurant")) {
      return val;
    }
  }

  // 3 — last resort: any UUID claim that isn't the standard "sub" / "jti"
  for (const [key, val] of Object.entries(claims)) {
    if (typeof val === "string" && UUID_RE.test(val) &&
        key !== "sub" && key !== "jti") {
      return val;
    }
  }

  return null;
}

const BRANCH_KEYS = [
  "branch_id", "BranchId", "branchId", "branch", "bid", "X-Branch-Id",
];

/** Find a branch ID inside JWT claims regardless of the exact key name */
function extractBranchId(claims: Record<string, unknown>): string | null {
  // 1 — check well-known key names first
  for (const key of BRANCH_KEYS) {
    const val = claims[key];
    if (typeof val === "string" && UUID_RE.test(val)) return val;
  }
  // 2 — scan ALL claims: any UUID-valued key whose name hints at branch
  for (const [key, val] of Object.entries(claims)) {
    if (typeof val === "string" && UUID_RE.test(val) &&
        key.toLowerCase().includes("branch")) {
      return val;
    }
  }
  return null;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  // Wipe any stale session from a previous account before setting new values.
  session.clear();
  // Send X-Client-Type: mobile so the backend returns the JWT in the response
  // body. For web clients it otherwise sets an httpOnly cookie that the SPA
  // cannot read, which means we could never decode the restaurant_id claim
  // (that's why "No restaurant ID set" kept showing). The cookie path still
  // works for auth; this just also gives us a readable token.
  const res = await api.post<{
    accessToken?: string;
    token?: string;
    access_token?: string;
    data?: { accessToken?: string; token?: string };
    expiresAt?: string;
  }>(
    "/v1/login",
    { email, password },
    { headers: { "X-Client-Type": "mobile" } }
  );

  const token =
    res.accessToken ??
    res.token ??
    res.access_token ??
    res.data?.accessToken ??
    res.data?.token ??
    "";
  if (token) session.setToken(token);
  session.setLoggedIn();

  let restaurantId: string | null = null;
  let branchId: string | null = null;
  if (token) {
    const claims = decodeJwt(token);
    // Auto-fill from token claims when the backend includes them.
    restaurantId = extractRestaurantId(claims);
    if (restaurantId) session.setRestaurantId(restaurantId);
    branchId = extractBranchId(claims);
    if (branchId) session.setBranchId(branchId);
  }

  // Fall back to any previously saved (manually entered) values.
  restaurantId ??= session.getRestaurantId();
  branchId ??= session.getBranchId();

  // Final fallback: one-time configured defaults (set once in .env) so a
  // merchant never has to know about tokens or paste an ID manually. Resolution
  // order is: token claims  >  previously saved value  >  .env default.
  const envRestaurant = (import.meta.env.VITE_DEFAULT_RESTAURANT_ID as string | undefined)?.trim() || null;
  const envBranch     = (import.meta.env.VITE_DEFAULT_BRANCH_ID     as string | undefined)?.trim() || null;
  if (!restaurantId && envRestaurant) restaurantId = envRestaurant;
  if (!branchId && envBranch)         branchId     = envBranch;

  // Persist whatever we resolved so the whole app is wired right after login.
  if (restaurantId) session.setRestaurantId(restaurantId);
  if (branchId)     session.setBranchId(branchId);

  const name = email.split("@")[0];
  session.setUserName(name);

  return { name, restaurantId, branchId };
}

export function logout() {
  session.clear();
}

export async function setPassword(token: string, password: string): Promise<void> {
  await api.patch("/v1/auth/set-password", { token, password });
}
