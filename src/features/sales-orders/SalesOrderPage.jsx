import { useState } from "react";

import NewSalesOrderForm from "./NewSalesOrderForm";

import "./salesOrder.css";

export default function SalesOrderPage({ onNavigate }) {
  const [showNewOrder, setShowNewOrder] = useState(false);

  if (showNewOrder) {
    return (
      <NewSalesOrderForm
        onCancel={() => setShowNewOrder(false)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="sales-order-page">
      <div className="sales-order-header">
        <div>
          <h1>Sales Order</h1>

          <p>Manage sales transaction</p>
        </div>

        <button
          className="ui-button-primary"
          onClick={() => setShowNewOrder(true)}>
          + New Order
        </button>
      </div>

      <div className="ui-card">
        <h2>Sales Order Module</h2>

        <p>Sales Order V3 foundation ready.</p>
      </div>
    </div>
  );
}
