import { paymentStore } from "../../state/paymentStore.js";

function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function SalesOrderDetailDrawer({ order, onClose }) {
  if (!order) return null;

  const payments = paymentStore.getPaymentsBySO(order.soNumber);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balance = Math.max(Number(order.grandTotal || 0) - totalPaid, 0);
  const paymentStatus = totalPaid <= 0 ? "UNPAID" : totalPaid >= Number(order.grandTotal || 0) ? "PAID" : "PARTIALLY PAID";

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
              <div className="sales-order-detail-item" key={item.soItemId}>
                <div><strong>{item.soItemId}</strong><span>Product ID: {item.productId}</span></div>
                <div><span>Qty {item.quantity}</span><strong>{formatIDR(item.itemTotal)}</strong></div>
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
            <div className="sales-order-detail-empty">WO creation is governed by the Work Order phase. This SO is ready for the next execution step.</div>
          </section>
        </div>
      </aside>
    </>
  );
}

function DetailRow({ label, value }) {
  return <div className="sales-order-detail-row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}
