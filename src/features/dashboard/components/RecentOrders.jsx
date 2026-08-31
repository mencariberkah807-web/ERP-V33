import EmptyState from "../../../components/ui/EmptyState/EmptyState.jsx";

export default function RecentOrders() {
  return (
    <section className="dashboard-section dashboard-recent-orders">
      <h2 className="dashboard-section-title">Recent Orders</h2>

      <EmptyState className="dashboard-empty-state">
        <p className="dashboard-empty-copy">No order data is available.</p>
      </EmptyState>
    </section>
  );
}
