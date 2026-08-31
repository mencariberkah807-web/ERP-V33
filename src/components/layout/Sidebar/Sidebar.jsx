export default function Sidebar({ activePage, onNavigate }) {
  function navClass(page) {
    return activePage === page ? "nav-item nav-item--active" : "nav-item";
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img
          className="sidebar-brand-logo"
          src="/assets/artkrilik_logo_blue.png"
          alt="ARTKRILIK WORKS"
        />

        <img
          className="sidebar-brand-icon"
          src="/assets/favicon_artwork icon.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <nav className="sidebar-nav">
        <section className="nav-section">
          <div className="nav-section-title">ACTIVE</div>

          <button
            type="button"
            className={navClass("dashboard")}
            onClick={() => onNavigate("dashboard")}>
            Dashboard
          </button>

          <button
            type="button"
            className={navClass("sales-order")}
            onClick={() => onNavigate("sales-order")}>
            Sales Order
          </button>

          <button
            type="button"
            className={navClass("payment")}
            onClick={() => onNavigate("payment")}>
            Payment
          </button>

          <button
            type="button"
            className={navClass("customer")}
            onClick={() => onNavigate("customer")}>
            Customer
          </button>

          <button
            type="button"
            className={navClass("product")}
            onClick={() => onNavigate("product")}>
            Product
          </button>

          <button type="button" className="nav-item">
            Work Order
          </button>

          <button type="button" className="nav-item">
            Production
          </button>

          <button type="button" className="nav-item">
            Fulfillment
          </button>

          <button type="button" className="nav-item">
            Settings
          </button>
        </section>

        <section className="nav-section">
          <div className="nav-section-title">FUTURE / IN DEVELOPMENT</div>

          <div className="nav-item nav-item--future">
            <span>HR</span>
            <span className="nav-item-status">In Development</span>
          </div>

          <div className="nav-item nav-item--future">
            <span>Finance</span>
            <span className="nav-item-status">In Development</span>
          </div>

          <div className="nav-item nav-item--future">
            <span>Purchasing</span>
            <span className="nav-item-status">In Development</span>
          </div>

          <div className="nav-item nav-item--future">
            <span>Warehouse / Stock</span>

            <span className="nav-item-status">In Development</span>
          </div>
        </section>
      </nav>
    </aside>
  );
}
