import MainLayout from "../components/layout/MainLayout";
import BranchSwitcher from "../components/layout/BranchSwitcher";
import SummaryCard from "../components/dashboard/SummaryCard";
import RecentOrdersCard from "../components/dashboard/RecentOrdersCard";

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slyce-dark">Dashboard</h1>
        <div className="mt-0.5">
          <BranchSwitcher />
        </div>
      </div>

      {/* Summary */}
      <SummaryCard />

      {/* Recent Orders */}
      <RecentOrdersCard />
    </MainLayout>
  );
}
