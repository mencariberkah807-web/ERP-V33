import { useMemo, useState } from "react";

import { salesOrderStore } from "../../state/salesOrderStore.js";
import SalesOrderCreateFormV3 from "./SalesOrderCreateFormV3.jsx";
import SalesOrderDetailDrawer from "./SalesOrderDetailDrawer.jsx";

import "./salesOrder.css";
import "./salesOrderList.css";

function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function SalesOrderPage() {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orders, setOrders] = useState(() => salesOrderStore.getSalesOrders());

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...orders]
      .filter((order) => statusFilter === "ALL" || order.status === statusFilter)
      .filter((order) => {
        if (!keyword) return true;
        return [order.soNumber, order.customer?.displayName, order.marketplace?.customer, order.orderTypeLabel]
          .some((value) => String(value ?? "").toLowerCase().includes(keyword));
      })
      .sort((a, b) => String(b.soNumber).localeCompare(String(a.soNumber), undefined, { numeric: true }));
  }, [orders, search, statusFilter]);

  function refreshOrders() {
    setOrders(salesOrderStore.getSalesOrders());
  }

  function handleCreated(order) {
    refreshOrders();
    setShowNewOrder(false);
    setSelectedOrder(order);
  }

  function handleSaved(order) {
    refreshOrders();
    setEditingOrder(null);
    setSelectedOrder(order);
  }

  function handleCancelled(order) {
    refreshOrders();
    setSelectedOrder(order);
  }

  if (showNewOrder) {
    return <SalesOrderCreateFormV3 onCancel={() => setShowNewOrder(false)} onCreated={handleCreated} />;
  }

  if (editingOrder) {
    return <SalesOrderCreateFormV3 initialOrder={editingOrder} onCancel={() => setEditingOrder(null)} onSaved={handleSaved} />;
  }

  return (
    <div className="sales-order-page">
      <div className="sales-order-header sales-order-list-header">
        <div><h1>Sales Order</h1><p>Manage sales transactions</p></div>
        <button className="ui-button-primary" type="button" onClick={() => setShowNewOrder(true)}>+ New Order</button>
      </div>

      <section className="ui-card sales-order-list-card">
        <div className="sales-order-list-toolbar">
          <input className="ui-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SO, customer, marketplace..." />
          <select className="ui-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Status</option>
            <option value="NEW ORDER">New Order</option>
            <option value="READY PRODUCTION">Ready WO</option>
            <option value="IN PRODUCTION">In Progress</option>
            <option value="PACKING">Packing</option>
            <option value="RTS">RTS</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="sales-order-table-wrap">
          <table className="sales-order-table">
            <thead><tr><th>SO Number</th><th>Order Type</th><th>Customer</th><th>Deadline</th><th>Status</th><th className="sales-order-number-cell">Total</th></tr></thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="sales-order-empty">No Sales Orders found.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="sales-order-row" onClick={() => setSelectedOrder(order)}>
                  <td><strong>{order.soNumber}</strong></td>
                  <td>{order.orderTypeLabel}</td>
                  <td>{order.customer?.displayName || order.marketplace?.customer || "—"}</td>
                  <td>{order.deadline || "—"}</td>
                  <td><span className="sales-order-status-badge">{order.status === "READY PRODUCTION" ? "Ready WO" : order.status}</span></td>
                  <td className="sales-order-number-cell">{formatIDR(order.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrder && (
        <SalesOrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onEdit={(order) => {
            setSelectedOrder(null);
            setEditingOrder(order);
          }}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
