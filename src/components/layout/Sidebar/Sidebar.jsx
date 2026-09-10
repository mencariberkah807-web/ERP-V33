function NavIcon({ type }) {
  const paths = {
    dashboard: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    sales: "M4 5h16v14H4zM8 9h8M8 13h5",
    payment: "M4 7h16v12H4zM4 10h16M8 15h4",
    customer: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0M15 8h5M15 12h5M15 16h5",
    product: "M4 7h16v13H4zM7 7V5h10v2",
    work: "M4 6h16v14H4zM8 3v6M16 3v6M8 14h8M8 17h5",
    production: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
    fulfillment: "M3 7h11v10H3zM14 10h4l3 3v4h-7zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4",
  };

  return (
    <svg className="nav-item-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar({ activePage, onNavigate }) {
  const navClass = (page) => activePage === page ? "nav-item nav-item--active" : "nav-item";

  const item = (page, label, icon) => (
    <button type="button" className={navClass(page)} onClick={() => onNavigate(page)}>
      <NavIcon type={icon} />
      <span>{label}</span>
    </button>
  );

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img className="sidebar-brand-logo" src="/assets/artkrilik_logo_blue.png" alt="ARTKRILIK WORKS" />
        <img className="sidebar-brand-icon" src="/assets/favicon_artwork icon.png" alt="" aria-hidden="true" />
      </div>

      <nav className="sidebar-nav">
        <section className="nav-section">
          <div className="nav-section-title">Workspace</div>
          {item("dashboard", "Dashboard", "dashboard")}
          {item("sales-order", "Sales Order", "sales")}
          {item("payment", "Payment", "payment")}
          {item("customer", "Customer", "customer")}
          {item("product", "Product", "product")}
          {item("work-order", "Work Order", "work")}
          <button type="button" className="nav-item"><NavIcon type="production" /><span>Production</span></button>
          <button type="button" className="nav-item"><NavIcon type="fulfillment" /><span>Fulfillment</span></button>
          <button type="button" className="nav-item"><NavIcon type="settings" /><span>Settings</span></button>
        </section>

        <section className="nav-section nav-section--future">
          <div className="nav-section-title">Coming next</div>
          <div className="nav-item nav-item--future"><span>HR</span><span className="nav-item-status">Soon</span></div>
          <div className="nav-item nav-item--future"><span>Finance</span><span className="nav-item-status">Soon</span></div>
          <div className="nav-item nav-item--future"><span>Purchasing</span><span className="nav-item-status">Soon</span></div>
          <div className="nav-item nav-item--future"><span>Warehouse / Stock</span><span className="nav-item-status">Soon</span></div>
        </section>
      </nav>
    </aside>
  );
}
