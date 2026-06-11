import { HelpCircle, Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { userName } = useAuth();
  const initial = (userName?.trim()?.[0] ?? "U").toUpperCase();
  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 bg-cream">
          <button className="flex items-center gap-1.5 text-sm text-slyce-dark font-medium hover:text-green-primary transition-colors">
            <HelpCircle size={16} />
            Help
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-card transition-colors">
            <Bell size={18} className="text-slyce-dark" />
          </button>
          <div className="w-8 h-8 rounded-full bg-green-primary flex items-center justify-center text-white text-xs font-semibold">
            {initial}
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-6 pb-6">{children}</main>
      </div>
    </div>
  );
}
