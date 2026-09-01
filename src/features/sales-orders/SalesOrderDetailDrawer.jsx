import { useState } from "react";

import { paymentStore } from "../../state/paymentStore.js";
import { cancelSalesOrder } from "./services/salesOrderService.js";

function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

const PRE_PRODUCTION_STATUSES = new Set(["NEW ORDER", "READY PRODUCTION"]);

export default function SalesOrderDetailDrawer({ order, onClose, onEdit, onCancelled }) {
  const [actionError, setActionError] = useState("");
  if (!order) return null;

  const payments = paymentStore.getPaymentsBySO(order.soNumber);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(Number(order.grandTotal || 0) - totalPaid, 0);
  const paymentStatus = totalPaid <= 0 ? "UNPAID" : totalPaid >= Number(order.grandTotal || 0) ? "PAID" : "PARTIALLY PAID";
  const canEdit = PRE_PRODUCTION_STATUSES.has(order.status);
  const canCancel = PRE_PRODUCTION_STATUSES.has(order.status);

  function handleCancel() {
    if (!window.confirm(`Cancel ${order.soNumber}? This will mark the Sales Order INACTIVE and preserve its history.`)) return;

    try {
      const updated = cancelSalesOrder(order.id);
      onCancelled?.(updated);
    } catch (error) {
      setActionError(error?.message || "Sales Order gagal dibatalkan.");
    }
  }

  return (
    <>
      <button className="sales-order-detail-backdrop" type="button" onClick={onClose} aria-label="Close Sales Order Detail" />
      <aside className="sales-order-detail-drawer">
        <header className="sales-order-detail-header">
          <div>
            <span className="sales-order-detail-eyebrow">Sales Order Detail</span>
            <h2>{order.soNumber}</h2>
            <span>{order.orderTypeLabel}</span>
          </div>
          <button type="button" className="sales-order-detail-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="sales-order-detail-body">
          {actionError && <div className="sales-order-detail-error">{actionError}</div>}

          <section className="sales-order-detail-section sales-order-detail-actions">
            {canEdit && <button type="button" className="ui-button-primary" onClick={() => onEdit?.(order)}>Edit</button>}
            {canCancel && <button type="button" className="sales-order-detail-cancel" onClick={handleCancel}>Cancel Order</button>}
          </section>

          <section className="sales-order-detail-section">
            <h3>Order Information</h3>
            <DetailRow label="Status" value={order.status} />
            <DetailRow label="Order Date" value={order.orderDate} />
            <DetailRow label="Deadline" value={order.deadline} />
            <DetailRow label="Priority" value={order.priority} />
          </section>

          <section className="sales-order-detail-section">
            <h3>Customer</h3>
            <DetailRow label="Name" value={order.customer?.displayName || order.marketplace?.customer || "—"} />
            <DetailRow label="Mobile" value={order.customer?.mobile || "—"} />
            <DetailRow label="Email" value={order.customer?.email || "—"} />
            <DetailRow label="Address" value={order.customer?.address || "—"} />
          </section>

          {order.marketplace && <section className="sales-order-detail-section"><h3>Marketplace</h3><DetailRow label="Channel" value={order.marketplace.channel} /><DetailRow label="Tracking" value={order.marketplace.trackingNumber || "—"} /></section>}

          <section className="sales-order-detail-section">
            <h3>Items</h3>
            {order.items.map((item) => (
              <div className={`sales-order-detail-item ${item.status === "INACTIVE" ? "sales-order-detail-item-inactive" : ""}`} key={item.soItemId}>
                <div>
                  <strong>{item.soItemId}</strong>
                  <span>Product ID: {item.productId}</span>
                  <span>Qty {item.quantity} · Unit {formatIDR(item.unitPrice)} · Discount {formatIDR(item.discount)}</span>
                  {item.customRequest && <span>Custom / Special Request</span>}
                  {item.productionNotes && <span>Production Notes: {item.productionNotes}</span>}
                  {item.artwork?.name && <span>Artwork: {item.artwork.name}</span>}
                </div>
                <div><span>{item.status}</span><strong>{formatIDR(item.itemTotal)}</strong></div>
              </div>
            ))}
          </section>

          <section className="sales-order-detail-section">
            <h3>Payment</h3>
            <DetailRow label="Grand Total" value={formatIDR(order.grandTotal)} />
            <DetailRow label="Total Paid" value={formatIDR(totalPaid)} />
            <DetailRow label="Balance" value={formatIDR(balance)} />
            <DetailRow label="Payment Status" value={paymentStatus} />
          </section>

          <section className="sales-order-detail-section">
            <h3>Work Orders</h3>
            <div className="sales-order-detail-empty">WO records are owned by the Work Order phase. Direct Order remains NEW ORDER until the explicit Create WO execution step.</div>
          </section>
        </div>
      </aside>
    </>
  );
}

function DetailRow({ label, value }) {
  return <div className="sales-order-detail-row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}
