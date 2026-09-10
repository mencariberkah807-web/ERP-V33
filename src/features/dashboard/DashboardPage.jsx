import KpiCard from "./components/KpiCard.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import RecentOrders from "./components/RecentOrders.jsx";
import "./dashboard.css";

const operationalItems = [
  { label: "Sales Orders", value: "—", helper: "No live data" },
  { label: "Payments", value: "—", helper: "No live data" },
  { label: "Work Orders", value: "—", helper: "No live data" },
  { label: "Fulfillment", value: "—", helper: "No live data" },
];

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <KpiGrid title="Business Overview">
        {operationalItems.map((item) => (
          <KpiCard key={item.label}>
            <div className="dashboard-kpi-content">
              <span className="dashboard-kpi-label">{item.label}</span>
              <strong className="dashboard-kpi-value">{item.value}</strong>
              <span className="dashboard-kpi-helper">{item.helper}</span>
            </div>
          </KpiCard>
        ))}
      </KpiGrid>

      <RecentOrders />
    </div>
  );
}
