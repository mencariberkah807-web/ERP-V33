export default function Header({ user, onLogout, activePage }) {
  const pageLabels = {
    dashboard: "Dashboard",
    "sales-order": "Sales Order",
    payment: "Payment",
    customer: "Customer",
    product: "Product",
    "work-order": "Work Order",
  };

  const name = user?.name || user?.username || "User";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-page-title">{pageLabels[activePage] || "ERP Workspace"}</div>
        <label className="header-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search..." aria-label="Search" />
        </label>
      </div>

      <div className="header-right">
        <div className="header-user-menu">
          <div className="header-user-avatar" aria-hidden="true">{initials || "U"}</div>
          <div className="header-user-copy">
            <span className="header-user-name">{name}</span>
            <span className="header-user-role">Administrator</span>
          </div>
          <button type="button" className="header-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
