export default function OrderTypeSection({ salesOrder, updateSalesOrder }) {
  return (
    <section className="erp-card">
      <div className="erp-card-header">Order Type</div>

      <div className="erp-card-body">
        <div className="erp-flex erp-gap-4">
          <label className="erp-flex erp-items-center erp-gap-2">
            <input
              type="radio"
              name="orderType"
              value="Direct Order"
              checked={salesOrder.orderType === "Direct Order"}
              onChange={(e) => updateSalesOrder("orderType", e.target.value)}
            />

            <span>Direct Order</span>
          </label>

          <label className="erp-flex erp-items-center erp-gap-2">
            <input
              type="radio"
              name="orderType"
              value="Marketplace"
              checked={salesOrder.orderType === "Marketplace"}
              onChange={(e) => updateSalesOrder("orderType", e.target.value)}
            />

            <span>Marketplace</span>
          </label>
        </div>
      </div>
    </section>
  );
}
