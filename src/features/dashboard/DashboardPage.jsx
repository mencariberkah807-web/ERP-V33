import KpiCard from "./components/KpiCard.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import RecentOrders from "./components/RecentOrders.jsx";
import "./dashboard.css";

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <KpiGrid title="Business Overview">
        <KpiCard>
          <p className="dashboard-empty-copy">No data available.</p>
        </KpiCard>
      </KpiGrid>

      <KpiGrid title="Operational Overview">
        <KpiCard>
          <p className="dashboard-empty-copy">No data available.</p>
        </KpiCard>
      </KpiGrid>

      <RecentOrders />
    </div>
  );
}
