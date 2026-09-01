import { useMemo, useState } from "react";
import { salesOrderStore } from "../../state/salesOrderStore.js";
import { workOrderStore } from "../../state/workOrderStore.js";
import { createWorkOrdersForSalesOrder, startWorkOrder, completeWorkOrder } from "./workOrderService.js";
import WorkOrderDetailDrawer from "./components/WorkOrderDetailDrawer.jsx";
import "./work-orders.css";

const PROCESS_LABELS = ["Laser Cutting", "UV Printing", "Assembly", "Laser Marking", "Finishing"];

export default function WorkOrderPage() {
  const [orders, setOrders] = useState(() => salesOrderStore.getSalesOrders());
  const [workOrders, setWorkOrders] = useState(() => workOrderStore.getWorkOrders());
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const refresh = () => { setOrders(salesOrderStore.getSalesOrders()); setWorkOrders(workOrderStore.getWorkOrders()); };
  const rows = useMemo(() => workOrders.filter((wo) => wo.status !== "INACTIVE").filter((wo) => { const q = search.trim().toLowerCase(); return !q || [wo.woNumber, wo.soNumber, wo.soItemId, wo.productId, wo.customer?.displayName].some((v) => String(v ?? "").toLowerCase().includes(q)); }), [workOrders, search]);
  function createForOrder(order) { setError(""); try { createWorkOrdersForSalesOrder(order.id); refresh(); } catch (e) { setError(e?.message || "WO gagal dibuat."); } }
  function action(fn, wo) { setError(""); try { fn(wo.id); refresh(); setSelected(workOrderStore.getWorkOrders().find((x) => x.id === wo.id) || null); } catch (e) { setError(e?.message || "Action gagal."); } }
  return <div className="work-order-page">
    <header className="work-order-header"><div><h1>Work Order</h1><p>Production execution unit</p></div></header>
    {error && <div className="work-order-error">{error}</div>}
    <section className="ui-card work-order-create-card"><div className="work-order-card-header">Sales Orders Ready for WO</div><div className="work-order-order-list">
      {orders.filter((o) => ["NEW ORDER", "READY PRODUCTION"].includes(o.status)).map((order) => { const activeItems = (order.items || []).filter((item) => item.status !== "INACTIVE"); const existing = workOrders.filter((wo) => wo.soNumber === order.soNumber && wo.status !== "INACTIVE"); const missing = activeItems.filter((item) => !existing.some((wo) => wo.soItemId === item.soItemId)); return <div className="work-order-order-row" key={order.id}><div><strong>{order.soNumber}</strong><span>{order.orderTypeLabel} · {activeItems.length} Active Item(s)</span></div><button type="button" className="ui-button-primary" disabled={!missing.length} onClick={() => createForOrder(order)}>{missing.length ? `Create ${missing.length} WO` : "WO Created"}</button></div>; })}
      {!orders.some((o) => ["NEW ORDER", "READY PRODUCTION"].includes(o.status)) && <div className="work-order-empty">No Sales Orders waiting for Work Order.</div>}
    </div></section>
    <section className="ui-card"><div className="work-order-toolbar"><input className="ui-input" type="search" placeholder="Search WO, SO, SO Item, product..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="work-order-table-wrap"><table className="work-order-table"><thead><tr><th>WO</th><th>SO / Item</th><th>Product</th><th>Qty</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.length ? rows.map((wo) => <tr key={wo.id} onClick={() => setSelected(wo)}><td><strong>{wo.woNumber}</strong></td><td>{wo.soNumber}<br/><small>{wo.soItemId}</small></td><td>{wo.productId}</td><td>{wo.quantity}</td><td><span className="work-order-status">{wo.status}</span></td><td onClick={(e) => e.stopPropagation()}>{wo.status === "READY" && <button type="button" className="ui-button-primary" onClick={() => action(startWorkOrder, wo)}>Start</button>}{wo.status === "IN PRODUCTION" && <button type="button" className="ui-button-primary" onClick={() => action(completeWorkOrder, wo)}>Complete</button>}{wo.status === "COMPLETED PRODUCTION" && <span>Completed</span>}</td></tr>) : <tr><td colSpan="6" className="work-order-empty">No Work Orders found.</td></tr>}</tbody></table></div></section>
    {selected && <WorkOrderDetailDrawer workOrder={selected} processLabels={PROCESS_LABELS} onClose={() => setSelected(null)} />}
  </div>;
}
