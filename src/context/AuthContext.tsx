import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { session, session as s } from "../api/client";
import { logout as apiLogout } from "../api/auth";
import { getBranches, type Branch } from "../api/branches";

interface AuthState {
  isAuthenticated: boolean;
  restaurantId: string | null;
  branchId: string | null;
  userName: string | null;
}

interface AuthContextValue extends AuthState {
  branches: Branch[];
  branchesLoading: boolean;
  branchesError: string | null;
  activeBranch: Branch | null;
  setAuth: (name: string | null, restaurantId?: string | null, branchId?: string | null) => void;
  setRestaurantId: (id: string) => void;
  setBranchId: (id: string) => void;
  refreshBranches: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    isAuthenticated: s.isLoggedIn(),
    restaurantId:    s.getRestaurantId(),
    branchId:        s.getBranchId(),
    userName:        s.getUserName(),
  }));

  const [branches, setBranches]             = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError]     = useState<string | null>(null);

  const setAuth = (name: string | null, restaurantId?: string | null, branchId?: string | null) => {
    if (name)         session.setUserName(name);
    if (restaurantId) session.setRestaurantId(restaurantId);
    if (branchId)     session.setBranchId(branchId);
    session.setLoggedIn();
    setState({
      isAuthenticated: true,
      restaurantId: restaurantId ?? s.getRestaurantId(),
      branchId: branchId ?? s.getBranchId(),
      userName: name,
    });
  };

  const setRestaurantId = (id: string) => {
    s.setRestaurantId(id);
    setState((prev) => ({ ...prev, restaurantId: id }));
  };

  const setBranchId = (id: string) => {
    s.setBranchId(id);
    setState((prev) => ({ ...prev, branchId: id }));
  };

  // Take the restaurant ID (from the login token claims) and load its branches.
  const refreshBranches = useCallback(async () => {
    // GET /v1/branches/dropdown is scoped to the logged-in restaurant via the
    // token, so we can load branches as soon as the user is authenticated.
    setBranchesLoading(true);
    setBranchesError(null);
    try {
      const list = await getBranches();
      setBranches(list);
      // Keep the current branch if it is still valid, otherwise pick the first.
      setState((prev) => {
        const stillValid = prev.branchId && list.some((b) => b.id === prev.branchId);
        if (stillValid) return prev;
        const first = list[0]?.id ?? null;
        if (first) s.setBranchId(first);
        return { ...prev, branchId: first ?? prev.branchId };
      });
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : "Failed to load branches");
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  // Whenever the user is authenticated and we know the restaurant, load branches.
  useEffect(() => {
    if (state.isAuthenticated) {
      void refreshBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, refreshBranches]);

  const logout = () => {
    apiLogout();
    setBranches([]);
    setBranchesError(null);
    setState({ isAuthenticated: false, restaurantId: null, branchId: null, userName: null });
  };

  const activeBranch = branches.find((b) => b.id === state.branchId) ?? null;

  const ctxValue: AuthContextValue = {
    ...state,
    branches,
    branchesLoading,
    branchesError,
    activeBranch,
    setAuth,
    setRestaurantId,
    setBranchId,
    refreshBranches,
    logout,
  };

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
