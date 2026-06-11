import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  ChefHat,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navSections = [
  {
    label: "Monitor your performance",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",     path: "/dashboard" },
      { icon: ClipboardList,   label: "Order History", path: "/orders" },
    ],
  },
  {
    label: "Manage your business",
    items: [
      { icon: Store,   label: "Branches",        path: "/branches" },
      { icon: ChefHat, label: "Menu Management", path: "/menu" },
      { icon: Clock,   label: "Opening Times",   path: "/opening-times" },
      { icon: Settings,label: "Settings",        path: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, userName } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="w-56 bg-white flex-shrink-0 flex flex-col h-screen sticky top-0 border-r border-slyce-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slyce-border flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/greenLogo.png" alt="Slyce" className="w-6 h-6 object-contain" />
          <span className="font-semibold text-sm text-slyce-dark">for Merchant</span>
        </Link>
      </div>

      {/* Navigation — scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-slyce-grey uppercase tracking-wide px-2 mb-2">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-green-primary text-white"
                          : "text-slyce-dark hover:bg-cream"
                      }`}
                    >
                      <Icon size={16} className={isActive ? "text-white" : "text-slyce-grey"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + Logout — pinned to bottom */}
      <div className="flex-shrink-0 border-t border-slyce-border px-4 py-4">
        {userName && (
          <p className="text-xs text-slyce-grey mb-3 truncate px-1">
            Signed in as <span className="font-semibold text-slyce-dark">{userName}</span>
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}
