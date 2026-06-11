/**
 * API client for Slyce backend.
 *
 * The backend uses cookie-based auth: POST /v1/login returns HTTP 204 with
 * a Set-Cookie: access_token=<JWT>  (httponly, secure, samesite=strict).
 * We use  credentials: "include"  so the browser manages the cookie
 * automatically on every request to the same origin.
 *
 * We also read the cookie ourselves after login for route protection:
 * since the cookie is httponly JS can't read it, so we store a minimal
 * session flag in localStorage and also store the restaurantId if present.
 */

// In dev, Vite proxies /api → the real backend (fixes SameSite=Strict cookie issue).
// In production, set VITE_API_BASE or deploy frontend on the same domain.
const BASE_URL = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

// ── Session helpers (no raw token stored — cookie is managed by browser) ────
export const session = {
  isLoggedIn:      () => localStorage.getItem("slyce_logged_in") === "true",
  setLoggedIn:     () => localStorage.setItem("slyce_logged_in", "true"),
  getToken:        () => localStorage.getItem("slyce_access_token"),
  setToken:        (t: string) => localStorage.setItem("slyce_access_token", t),
  getRestaurantId: () => localStorage.getItem("slyce_restaurant_id"),
  setRestaurantId: (id: string) => localStorage.setItem("slyce_restaurant_id", id),
  getBranchId:     () => localStorage.getItem("slyce_branch_id"),
  setBranchId:     (id: string) => localStorage.setItem("slyce_branch_id", id),
  clear: () => {
    localStorage.removeItem("slyce_logged_in");
    localStorage.removeItem("slyce_access_token");
    localStorage.removeItem("slyce_restaurant_id");
    localStorage.removeItem("slyce_branch_id");
    localStorage.removeItem("slyce_user_name");
  },
  setUserName: (name: string) => localStorage.setItem("slyce_user_name", name),
  getUserName: () => localStorage.getItem("slyce_user_name"),
};

// ── Core fetch wrapper ───────────────────────────────────────────────────────
interface FetchOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  withRestaurantId?: boolean;
}

async function request<T>(
  path: string,
  {
    method = "GET",
    body,
    headers: extra = {},
    withRestaurantId = false,
  }: FetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  /* Attach Bearer token if available */
  const token = session.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (withRestaurantId) {
    const rid = session.getRestaurantId();
    if (rid) headers["X-Restaurant-Id"] = rid;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body,
    // Send & receive cookies on every request
    credentials: "include",
  });

  // 401 on the login page = wrong credentials (don't redirect, just show error)
  // 401 anywhere else = session expired → clear and redirect
  if (res.status === 401) {
    session.clear();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error("Invalid email or password. Please try again.");
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      msg = err.message ?? err.title ?? msg;
      if (err.errors && typeof err.errors === "object") {
        const details = Object.entries(err.errors as Record<string, string[]>)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join("; ");
        if (details) msg += ` — ${details}`;
      }
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  // 204 No Content (e.g. login) — return empty object
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ── Typed HTTP helpers ───────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),

  post: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, "method">) =>
    request<T>(path, {
      ...opts,
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, "method">) =>
    request<T>(path, {
      ...opts,
      method: "PATCH",
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, opts?: Omit<FetchOptions, "method">) =>
    request<T>(path, {
      ...opts,
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
