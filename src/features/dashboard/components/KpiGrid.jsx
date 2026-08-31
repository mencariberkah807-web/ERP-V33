export default function KpiGrid({ title, children }) {
  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section-title">{title}</h2>

      <div className="dashboard-kpi-grid">{children}</div>
    </section>
  );
}
