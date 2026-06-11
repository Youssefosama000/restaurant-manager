import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage        from "./pages/LandingPage";
import LoginPage          from "./pages/LoginPage";
import SetPasswordPage    from "./pages/SetPasswordPage";
import DashboardPage      from "./pages/DashboardPage";
import OrderHistoryPage   from "./pages/OrderHistoryPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import SettingsPage       from "./pages/SettingsPage";
import OpeningTimesPage   from "./pages/OpeningTimesPage";
import SubscriptionsPage  from "./pages/SubscriptionsPage";
import BranchesPage       from "./pages/BranchesPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"             element={<LandingPage />} />
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/orders"       element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
      <Route path="/subscriptions"element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/opening-times"element={<ProtectedRoute><OpeningTimesPage /></ProtectedRoute>} />
      <Route path="/menu"         element={<ProtectedRoute><MenuManagementPage /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/branches"     element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
