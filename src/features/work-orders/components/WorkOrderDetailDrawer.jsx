function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function WorkOrderDetailDrawer({ workOrder, processLabels, onClose }) {
  return <>
    <button className="work-order-detail-backdrop" type="button" aria-label="Close Work Order Detail" onClick={onClose} />
    <aside className="work-order-detail-drawer">
      <header className="work-order-detail-header"><div><span>Work Order Detail</span><h2>{workOrder.woNumber}</h2><strong>{workOrder.status}</strong></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
      <div className="work-order-detail-body">
        <section><h3>Job</h3><Row label="SO" value={workOrder.soNumber}/><Row label="SO Item" value={workOrder.soItemId}/><Row label="Customer" value={workOrder.customer?.displayName || workOrder.marketplace?.customer}/><Row label="Product" value={workOrder.productId}/><Row label="Qty" value={workOrder.quantity}/><Row label="Deadline" value={workOrder.deadline}/></section>
        <section><h3>Instructions</h3><Row label="Specification" value={workOrder.specification}/><Row label="Production Notes" value={workOrder.productionNotes}/><Row label="Artwork" value={workOrder.artwork?.name}/></section>
        <section><h3>Process</h3><div className="work-order-process-list">{processLabels.map((label) => <div key={label}><span>{label}</span><strong>{workOrder.process?.[label.replaceAll(" ", "").replace("LaserCutting", "laserCutting").replace("UVPrinting", "uvPrinting").replace("LaserMarking", "laserMarking").replace("Assembly", "assembly").replace("Finishing", "finishing")] || "PENDING"}</strong></div>)}</div></section>
        <section><h3>Timeline</h3><div className="work-order-timeline">{(workOrder.timeline || []).map((entry, index) => <div key={`${entry.at}-${index}`}><strong>{entry.status}</strong><span>{formatDate(entry.at)}</span></div>)}</div></section>
      </div>
    </aside>
  </>;
}
function Row({ label, value }) { return <div className="work-order-detail-row"><span>{label}</span><strong>{value || "—"}</strong></div>; }
